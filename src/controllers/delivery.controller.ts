import type { Request, Response } from 'express';

import prisma from '../config/db';
import { uploadImageToAzure } from './image.controller';
import { getCoordinates, getRoute } from '../utils/geo';
import { sendDeliveryAssignmentNotification } from '../utils/notification';

import type { CreateDeliveryInput, UpdateDeliveryInput } from '../types/delivery';

export const getAllDeliveries = async (req: Request, res: Response) => {
  try {
    const deliveries = await prisma.delivery.findMany({
      include: {
        courier: true,
        parcels: true,
        image: true,
      },
    });
    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
};

export const getDeliveryById = async (req: Request, res: Response) => {
  const { id } = req.params;

  const isAdmin = (req as any).isAdmin;
  const courierId = (req as any).courierId;

  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(id) },
      include: {
        parcels: true,
        image: true,
      },
    });

    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    if (!isAdmin && delivery.courierId !== Number(courierId)) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(delivery);
  } catch (err) {
    console.error('Error fetching delivery:', err);
    res.status(500).json({ error: 'Failed to fetch delivery' });
  }
};

export const getCourierDeliveries = async (req: Request, res: Response) => {
  const courierId = (req as any).courierId;
  try {
    const deliveries = await prisma.delivery.findMany({
      where: {
        courierId: Number(courierId),
        NOT: [{ status: 'completed' }, { status: 'parcel-left' }],
      },
      include: {
        parcels: true,
        image: true,
      },
      orderBy: { index: 'asc' },
    });

    // Check if any of the indexes are null
    const hasNullIndex = deliveries.some((delivery) => delivery.index === -1);

    if (hasNullIndex) {
      const updatedDeliveries = await getRoute(deliveries);

      await Promise.all(
        updatedDeliveries.map((delivery) =>
          prisma.delivery.update({
            where: { id: delivery.id },
            data: { index: delivery.index },
          })
        )
      );

      const sortedDeliveries = updatedDeliveries.sort((a, b) => a.index - b.index);

      res.json(sortedDeliveries);
      return;
    }

    res.json(deliveries);
  } catch (err) {
    console.error('Error fetching deliveries for courier:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries for courier' });
  }
};

export const createDelivery = async (req: Request, res: Response) => {
  const data: CreateDeliveryInput = req.body;

  if (
    !data.courierId ||
    !data.address1 ||
    !data.postalCode ||
    !data.city ||
    !data.country ||
    !data.parcel
  ) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!Array.isArray(data.parcel)) {
    return res.status(400).json({ error: 'Parcel must be an array' });
  }

  try {
    const addressString = `${data.address1}, ${data.postalCode}, ${data.city}, ${data.country}`;

    const { coordinateX, coordinateY } = await getCoordinates(addressString);

    if (!coordinateX || !coordinateY) {
      return res.status(400).json({ error: 'Could not determine coordinates for the address' });
    }

    const delivery = await prisma.delivery.create({
      data: {
        courier: { connect: { id: Number(data.courierId) } },
        address1: data.address1,
        address2: data.address2,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        comment: data.comment,
        coordinateX,
        coordinateY,
        parcels: {
          create: data.parcel.map((parcel) => ({
            weight: parcel.weight,
            dimensions: parcel.dimensions,
          })),
        },
      },
      include: {
        parcels: true,
        courier: true,
      },
    });

    // Send notification to the courier about the new delivery assignment
    if (delivery.courierId) {
      const addressString = `${delivery.address1}, ${delivery.city}`;
      await sendDeliveryAssignmentNotification(
        delivery.courierId,
        delivery.id,
        addressString
      );
    }

    res.status(201).json(delivery);
  } catch (err) {
    console.error('Error creating delivery:', err);
    res.status(500).json({ error: 'Failed to create delivery' });
  }
};

export const updateDelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: UpdateDeliveryInput = req.body;

  if (!data || Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'No update data provided' });
  }

  if (data.status && !['in-progress', 'delivered', 'parcel-left'].includes(data.status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const delivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        status: data.status,
        address1: data.address1,
        address2: data.address2,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        comment: data.comment,
        courierId: data.courierId ? Number(data.courierId) : undefined,
      },
    });
    res.json(delivery);
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ error: 'Failed to update delivery' });
  }
};

export const deleteDelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await prisma.delivery.delete({ where: { id: Number(id) } });
    res.status(204).end();
  } catch (err) {
    console.error('Error deleting delivery:', err);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
};

export const deliver = async (req: Request, res: Response) => {
  const { id } = req.params;
  const imageUrl = await uploadImageToAzure(req);

  // If delivery has already been completed or parcel left, return an error
  const existingDelivery = await prisma.delivery.findFirst({
    where: {
      id: Number(id),
      status: { in: ['completed', 'parcel-left'] },
    },
    select: { status: true },
  });

  if (existingDelivery) {
    return res.status(409).json({ error: 'Delivery already marked as completed' });
  }

  try {
    let delivery;

    if (imageUrl) {
      delivery = await prisma.delivery.update({
        where: { id: Number(id) },
        data: {
          status: 'parcel-left',
          image: {
            upsert: {
              create: { url: imageUrl },
              update: { url: imageUrl },
            },
          },
        },
        include: { image: true },
      });
    } else {
      delivery = await prisma.delivery.update({
        where: { id: Number(id) },
        data: { status: 'completed' },
      });
    }

    res.json(delivery);
  } catch (err) {
    console.error('Error updating delivery status:', err);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
};
