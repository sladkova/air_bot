<script setup>
import { ref, onMounted } from 'vue'


let dateOfApplication = ref(null);

defineProps({
  msg: String,
  
})
onMounted(() => {
  fetch("https://zpspace.com.ua:3000/api/airdata")
          .then((response) => response.json())
          .then((data) => {
            const applicationsList = document.getElementById("applications-list");
            

            data.forEach((application) => {
              dateOfApplication = new Date(application.timestamp);
              dateOfApplication.setHours(dateOfApplication.getHours() + 1);

              const formattedDate = dateOfApplication.toLocaleString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const formattedTime = dateOfApplication.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: 'numeric',
                second: 'numeric',
              });

              const listItem = document.createElement("li");
              listItem.textContent = `Користувач ${application.username} (ID: ${application.userId}) відправив заявку з координатами ${application.latitude}, ${application.longitude}, швидкістю вітру ${application.windSpeed} м/c та напрямком ${application.windDirection} час створення заявки   ${formattedDate} ${formattedTime}`;
    
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
