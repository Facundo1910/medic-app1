<template>
  <router-view />
</template>

<script>
export default {
  name: "App"
};
</script>

<style>
/* Puedes dejar es tilos globales aquí si lo deseas */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-image: url('./assets/fondo.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  min-height: 100vh;
}

#app {
  min-height: 100vh;
}
</style>
