<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  msg: String,
})
onMounted(() => {
  fetch("http://localhost:3000/api/airdata")
          .then((response) => response.json())
          .then((data) => {
            const applicationsList = document.getElementById("applications-list");
    
            data.forEach((application) => {
              const listItem = document.createElement("li");
              listItem.textContent = `Користувач ${application.username} (ID: ${application.userId}) відправив заявку з координатами ${application.latitude}, ${application.longitude}, швидкістю вітру ${application.windSpeed} м/c та напрямком ${application.windDirection}.`;
    
              applicationsList.appendChild(listItem);
            });
          })
          .catch((error) => {
            console.error("Помилка отримання даних:", error);
          });
 })
</script>

<template>
      <h1>Заявки</h1>
      <ul id="applications-list"></ul>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
