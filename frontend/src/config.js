const dev = {
    baseUrl: "http://127.0.0.1:8787",
  };
  
  const prod = {
    baseUrl: "https://promptcraft-backend.debojitkangsabanik.workers.dev",
  };
  
  export const config = process.env.NODE_ENV === "production" ? prod : dev;
  