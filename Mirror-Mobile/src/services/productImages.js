// Mapeamento de product.id → imagem local (require resolve em build time, sem requisição de rede).
// Para adicionar um novo produto:
//   1. Salve o arquivo em assets/images/<nome>.jpg
//   2. Adicione a linha: <id>: require('../../assets/images/<nome>.jpg'),
export const PRODUCT_IMAGES = {
  // Descomente APÓS copiar o arquivo para assets/images/x-salada.jpg:
  1: require('../../assets/images/x-salada.jpeg'),
  2: require('../../assets/images/x-bacon.jpeg'),
  3: require('../../assets/images/x-gordao.jpeg'),
  4: require('../../assets/images/x-burguer.jpeg'),
  5: require('../../assets/images/x-vegetariano.jpg'),
  6 : require('../../assets/images/refrigerante.jpg'),
  7: require('../../assets/images/suco.jpg'),
  8: require('../../assets/images/agua.jpg'),
  9: require('../../assets/images/batata-frita.jpg'),
  10: require('../../assets/images/onion-rings.jpeg'),
  11: require('../../assets/images/brownie.jpg'),
  12: require('../../assets/images/combo-xbacon.jpg'),
  13: require('../../assets/images/combo-xsalada.jpg'),

 
  
  
};
