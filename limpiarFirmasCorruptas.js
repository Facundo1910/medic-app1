// limpiarFirmasCorruptas.js
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://facubas39:Facundo1905@cluster0.0iisnt5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

async function main() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Conectado a MongoDB');
    
    const db = client.db();
    const collection = db.collection('firmas');
    
    // Encuentra todas las firmas cuyo campo imagen parece un ObjectId (24 caracteres hexadecimales)
    const firmasCorruptas = await collection.find({ 
      imagen: { $regex: /^[a-f0-9]{24}$/ } 
    }).toArray();
    
    console.log(`Firmas corruptas encontradas: ${firmasCorruptas.length}`);

    if (firmasCorruptas.length > 0) {
      for (const firma of firmasCorruptas) {
        console.log(`Eliminando firma con _id: ${firma._id} (imagen: ${firma.imagen})`);
        await collection.deleteOne({ _id: firma._id });
      }
      console.log('Limpieza completada.');
    } else {
      console.log('No se encontraron firmas corruptas.');
    }
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main(); 