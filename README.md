<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/3b9c7512-357b-4ce1-bf18-99ef962e9cb3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Sincronização e SQL Connect

Os dados operacionais ficam em uma linha `AppState` por UID autenticado; a coluna `state` guarda o estado atual do app em JSONB, sem criar pedidos ou vendas fictícios. O app consulta o SQL Connect periodicamente para atualizar os outros dispositivos. Na primeira conexão, se ainda não houver estado no SQL, o app migra o documento Firestore `users/{UID}/appData/state`; se ele também não existir, importa os dados locais desse aparelho.

O serviço SQL Connect usa o serviço `pastelaria-projeto` na região `southamerica-east1` e a instância Cloud SQL `pastelaria-projeto-fdc`. Configure as variáveis `VITE_FIREBASE_*` para o projeto Firebase correspondente. Gere o SDK depois de alterar o esquema ou as operações com `firebase dataconnect:compile`. Para publicar esquema, operações, site e regras do Firestore (mantidas para a leitura de migração), execute `npm run deploy`.
