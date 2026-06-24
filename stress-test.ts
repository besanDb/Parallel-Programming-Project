// // stress-test.ts
// import axios from 'axios';

// const users = [
//   { email: 'test1@gmail.com', password: '123456' },
//   { email: 'test2@gmail.com', password: '123456' },
//   { email: 'test3@gmail.com', password: '123456' },
//   { email: 'test4@gmail.com', password: '123456' },
//   { email: 'test5@gmail.com', password: '123456' },
// ];

// async function runUser(user: any) {
//   try {
//     // 1) login
//     const loginRes = await axios.post('http://localhost:8080/auth/login', user);

//     const token = loginRes.data.data.accessToken;

//     // 2) checkout
//     const checkoutRes = await axios.post(
//       'http://localhost:8080/cart/checkout',
//       {},
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       },
//     );

//     console.log('SUCCESS:', user.email);
//   } catch (err: any) {
//     console.log('FAILED:', user.email, err.response?.status);
//   }
// }

// // 🔥 تشغيل كل المستخدمين بنفس اللحظة
// Promise.all(users.map(runUser));