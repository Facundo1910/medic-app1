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
    console.log('🔍 Buscando firma con ID:', id);
    
    // Verificar si el ID es válido
    if (!id || id.length !== 24) {
      console.log('❌ ID inválido:', id);
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const firma = await Firma.findById(id);
    console.log('📦 Firma encontrada:', firma ? 'Sí' : 'No');
    
    if (!firma) {
      console.log('❌ Firma no encontrada en MongoDB');
      // Buscar todas las firmas para debug
      const todasLasFirmas = await Firma.find({}).limit(5);
      console.log('🔍 Primeras 5 firmas en DB:', todasLasFirmas.map(f => ({ id: f._id, fecha: f.fecha })));
      return res.status(404).json({ error: 'No encontrada' });
    }
    
    console.log('✅ Firma encontrada, imagen length:', firma.imagen ? firma.imagen.length : 0);
    console.log('🔍 Campos del documento:', Object.keys(firma.toObject()));
    console.log('🖼️ Tipo de imagen:', typeof firma.imagen);
    console.log('📄 Primeros 50 caracteres de imagen:', firma.imagen ? firma.imagen.substring(0, 50) : 'null');
    return res.json({ imagen: firma.imagen });
  } else if (req.method === 'PUT') {
    const { id } = req.query;
    const { imagen } = req.body;
    console.log('🔄 PUT - Actualizando firma con ID:', id);
    console.log('🔍 PUT - Tipo de imagen recibida:', typeof imagen);
    console.log('📄 PUT - Primeros 100 caracteres:', imagen ? imagen.substring(0, 100) : 'null');
    if (!id || id.length !== 24) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    if (!imagen || typeof imagen !== 'string') {
      return res.status(400).json({ error: 'Imagen base64 requerida' });
    }
    const firma = await Firma.findById(id);
    if (!firma) {
      return res.status(404).json({ error: 'Firma no encontrada para actualizar' });
    }
    firma.imagen = imagen;
    firma.fecha = new Date();
    await firma.save();
    console.log('✅ PUT - Firma actualizada correctamente');
    return res.json({ ok: true, id: firma._id });
  } else {
    res.setHeader('Allow', ['GET', 'PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 