// migrate-cloudinary.js
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configuration Cloudinary (utilise les mêmes variables que votre app)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function migrateDocuments() {
  try {
    console.log('🔍 Recherche des fichiers dans gestdoc/documents/...');
    
    // 1. Récupérer tous les fichiers PDF dans l'ancien dossier
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'gestdoc/documents/',
      resource_type: 'raw',  // Pour les PDF
      max_results: 100
    });
    
    const files = result.resources;
    
    if (files.length === 0) {
      console.log('📂 Aucun fichier trouvé dans gestdoc/documents/');
      return;
    }
    
    console.log(`📁 ${files.length} fichier(s) trouvé(s) à migrer\n`);
    
    // 2. Migrer chaque fichier
    for (const [index, resource] of files.entries()) {
      const oldPublicId = resource.public_id;
      const newPublicId = oldPublicId.replace('gestdoc/documents/', 'document-share-platform/');
      
      console.log(`🔄 [${index + 1}/${files.length}] Migration de :`);
      console.log(`   De : ${oldPublicId}`);
      console.log(`   Vers: ${newPublicId}`);
      
      try {
        // Renommer/déplacer le fichier
        const result = await cloudinary.uploader.rename(
          oldPublicId, 
          newPublicId, 
          { 
            resource_type: 'raw',
            overwrite: false  // Évite d'écraser si le fichier existe déjà
          }
        );
        
        console.log(`   ✅ Succès ! Nouvelle URL: ${result.secure_url}\n`);
        
      } catch (error) {
        console.error(`   ❌ Erreur: ${error.message}\n`);
      }
    }
    
    console.log('🎉 Migration terminée !');
    
    // 3. Afficher un résumé
    console.log('\n📊 Résumé:');
    console.log(`   - Fichiers traités: ${files.length}`);
    console.log('   - Vérifiez dans Media Library que tout est bien présent');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
  }
}

// Exécuter la migration
migrateDocuments();