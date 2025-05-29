import 'dotenv/config';

export default {
  expo: {
    scheme: "acme",
    userInterfaceStyle: "automatic",
    orientation: "default",
    // web: {
    //   output: "static"
    // },
    // plugins: [
    //   [
    //     "expo-router",
    //     {
    //       origin: "https://n"
    //     }
    //   ]
    // ],
    name: "NYC Subway Challenge",
    slug: "frontend",
    jsEngine: "jsc",
    extra: {
      apiBaseUrl: process.env.API_BASE_URL 
    }
  }
};
