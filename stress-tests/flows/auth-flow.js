import { check } from 'k6';
import http from 'k6/http'

const Base_URL = 'http://localhost:8080';

export function registerAndLogin(userId) {
    const email = `stressuser_${userId}_${Date.now()}@test.com`;
    const password = 'TEST1234.';


     http.post(
        `${Base_URL}/auth/register`,
        JSON.stringify({email, password}),
        {headers: {'Content-Type':'application/json' }},
    );

    const login = http.post(
        `${Base_URL}/auth/login`,
          JSON.stringify({email, password}),
        {headers: {'Content-Type':'application/json' }},
    );
    
    check(login, { 'login success': (r)=>r.status ===201});
    const body = JSON.parse(login.body);
    //console.log('TOKEN:',  body.data?.accessToken);
    return body.data?.accessToken ?? null;

}