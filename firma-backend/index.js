require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // Permitir imágenes grandes en base64

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const firmaSchema = new mongoose.Schema({
  imagen: { type: String, required: true }, // base64
  fecha: { type: Date, default: Date.now }
});
const Firma = mongoose.model('Firma', firmaSchema);

// Endpoint para guardar una firma
app.post('/firmas', async (req, res) => {
  try {
    const { imagen } = req.body;
    if (!imagen) return res.status(400).json({ error: 'Falta la imagen' });
    const nuevaFirma = new Firma({ imagen });
    await nuevaFirma.save();
    res.status(201).json({ id: nuevaFirma._id });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la firma' });
  }
});

// Endpoint para recuperar una firma
app.get('/firmas/:id', async (req, res) => {
  try {
    const firma = await Firma.findById(req.params.id);
    if (!firma) return res.status(404).json({ error: 'No encontrada' });
    res.json({ imagen: firma.imagen });
  } catch (err) {
    res.status(500).json({ error: 'Error al buscar la firma' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor de firmas escuchando en puerto ${PORT}`);
}); 