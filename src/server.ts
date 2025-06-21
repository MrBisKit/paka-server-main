import app from './app';
const port = 3000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log(`Press Ctrl+C to stop the server`);
  console.log(`Press Ctrl+R to restart the server`);
});
