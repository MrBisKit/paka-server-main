import type { Request, Response } from 'express';
import type { ParcelInput } from '../types/delivery';
import prisma from '../config/db';

export const getAllParcelsInDelivery = async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { id: Number(deliveryId) },
      include: { parcels: true },
    });

    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    res.json(delivery.parcels);
  } catch (err) {
    console.error('Error fetching parcels in delivery:', err);
    res.status(500).json({ error: 'Failed to fetch parcels in delivery' });
  }
};

export const addParcelToDelivery = async (req: Request, res: Response) => {
  const { id } = req.params;
  const parcelData: ParcelInput = req.body;

  try {
    const delivery = await prisma.delivery.update({
      where: { id: Number(id) },
      data: {
        parcels: {
          create: parcelData,
        },
      },
      include: { parcels: true },
    });

    res.json(delivery);
  } catch (err) {
    console.error('Error adding parcel to delivery:', err);
    res.status(500).json({ error: 'Failed to add parcel to delivery' });
  }
};

export const editParcelInDelivery = async (req: Request, res: Response) => {
  const { deliveryId, parcelId } = req.params;
  const parcelData: ParcelInput = req.body;
  try {
    const delivery = await prisma.delivery.update({
      where: { id: Number(deliveryId) },
      data: {
        parcels: {
          update: {
            where: { id: Number(parcelId) },
            data: parcelData,
          },
        },
      },
      include: { parcels: true },
    });
    res.json(delivery);
  } catch (err) {
    console.error('Error editing parcel in delivery:', err);
    res.status(500).json({ error: 'Failed to edit parcel in delivery' });
  }
};

export const removeParcelFromDelivery = async (req: Request, res: Response) => {
  const { deliveryId, parcelId } = req.params;

  try {
    const delivery = await prisma.delivery.update({
      where: { id: Number(deliveryId) },
      data: {
        parcels: {
          delete: { id: Number(parcelId) },
        },
      },
      include: { parcels: true },
    });

    res.json(delivery);
  } catch (err) {
    console.error('Error removing parcel from delivery:', err);
    res.status(500).json({ error: 'Failed to remove parcel from delivery' });
  }
};
