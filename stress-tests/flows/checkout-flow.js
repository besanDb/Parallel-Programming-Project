import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'http://localhost:8080';

export function runCheckout(token) {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const productsRes = http.get(`${BASE_URL}/products`, { headers });

  const productsOk = check(productsRes, {
    'products loaded': (r) => r.status === 200,
  });

  if (!productsOk) return false;

  let parsedBody;
  try {
    parsedBody = JSON.parse(productsRes.body);
  } catch (e) {
    return false;
  }

  let productsList = Array.isArray(parsedBody) ? parsedBody : (parsedBody.data || parsedBody.products);

  if (!Array.isArray(productsList) || productsList.length === 0) {
    return false;
  }

  // const product = productsList[0]; 
    const product =
    productsList[
      Math.floor(Math.random() * productsList.length)
    ];
  const addToCartRes = http.post(
    `${BASE_URL}/cart`,
    JSON.stringify({ productId: product.id, quantity: 1 }),
    { headers }
  );

  const cartOk = check(addToCartRes, {
    'added to cart': (r) => r.status === 201,
  });

  if (!cartOk) return false;

  sleep(0.2);

  const checkoutRes = http.post(
    `${BASE_URL}/cart/checkout`,
    JSON.stringify({}),
    { headers }
  );

  const isCheckoutOk = checkoutRes.status === 200 || checkoutRes.status === 201;


  const transactionDetails = {
    timestamp: new Date().toISOString(),
    productId: product.id,
    //productName: product.name,
    stockBeforeCheckout: product.stock,
    //price: product.price,
    status: isCheckoutOk ? 'SUCCESS' : 'FAILED',
    checkoutStatusCode: checkoutRes.status
  };


  if (!isCheckoutOk) {
    transactionDetails.errorBody = checkoutRes.body;
  }


  console.log(JSON.stringify(transactionDetails));

  const checkoutOk = check(checkoutRes, {
    'checkout accepted': (r) => r.status === 200 || r.status === 201,
  });

  return checkoutOk;
}