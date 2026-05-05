// Mapeamento de product.id → imagem local (require resolve em build time, sem requisição de rede).
// Para adicionar um novo produto:
//   1. Salve o arquivo em assets/images/<nome>.jpg
//   2. Adicione a linha: <id>: require('../../assets/images/<nome>.jpg'),
export const PRODUCT_IMAGES = {
  // Descomente APÓS copiar o arquivo para assets/images/x-salada.jpg:
  1: require('../../assets/images/x-salada.jpeg'),
};
