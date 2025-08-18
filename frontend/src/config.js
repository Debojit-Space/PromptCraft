const dev = {
    baseUrl: "http://localhost:3001",
  };
  
  const prod = {
    baseUrl: "https://promptcraft-backend.debojitkangsabanik.workers.dev",
  };
  
  export const config = process.env.NODE_ENV === "production" ? prod : dev;
  