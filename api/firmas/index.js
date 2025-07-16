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
  await connectDB();

  if (req.method === 'POST') {
    const { imagen } = req.body;
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen' });
    const nuevaFirma = new Firma({ imagen });
    await nuevaFirma.save();
    return res.status(201).json({ id: nuevaFirma._id });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 