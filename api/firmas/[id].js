import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const firmaSchema = new mongoose.Schema({
  imagen: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
});
const Firma = mongoose.models.Firma || mongoose.model('Firma', firmaSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  await connectDB();

  if (req.method === 'GET') {
    const { id } = req.query;
    const firma = await Firma.findById(id);
    if (!firma) return res.status(404).json({ error: 'No encontrada' });
    return res.json({ imagen: firma.imagen });
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 