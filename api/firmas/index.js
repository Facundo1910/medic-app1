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

  if (req.method === 'POST') {
    const { imagen } = req.body;
    console.log('💾 Guardando nueva firma, imagen length:', imagen ? imagen.length : 0);
    console.log('🔍 POST - Tipo de imagen recibida:', typeof imagen);
    console.log('📄 POST - Primeros 100 caracteres:', imagen ? imagen.substring(0, 100) : null);
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen' });
    const nuevaFirma = new Firma({ imagen });
    await nuevaFirma.save();
    console.log('✅ Firma guardada con ID:', nuevaFirma._id);
    return res.status(201).json({ id: nuevaFirma._id });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 