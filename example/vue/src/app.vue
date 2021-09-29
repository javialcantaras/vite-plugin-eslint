<template>
  <div>
    <img alt="Vue logo" src="./assets/logo.png" />
    <hello-world msg="Hello Vue 3 + TypeScript + Vite" />
  </div>
</template>

<script lang="ts" setup>
import HelloWorld from './components/hello-world.vue';
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
