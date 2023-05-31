<script setup>
import { ref, onMounted } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet' 

let dateOfApplication = ref(null);
const lineCoordinates = ref([])
const markers = ref([]) 
const lines = ref([]) 
let map 

const calculateLineCoordinates = (pointCoordinates, windDirection, lineLength) => {
  const windDirectionRad = windDirection * (Math.PI / 180)
  const endPointLat = pointCoordinates[0] + lineLength * Math.cos(windDirectionRad)
  const endPointLng = pointCoordinates[1] + lineLength * Math.sin(windDirectionRad)
  return [pointCoordinates, [endPointLat, endPointLng]]
}

defineProps({
  msg: String,
  
})
onMounted(() => {

    map = L.map('mapContainer', {
    center: [47.8388, 35.1396], // Координати Запоріжжя
    zoom: 10, // Рівень масштабування,
    trackResize: false
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(map);


  fetch("https://zpspace.com.ua/api/airdata")
    .then((response) => response.json())
    .then((data) => {
      const applicationsList = document.getElementById("applications-list");

      data.forEach((application) => {
        dateOfApplication = new Date(application.timestamp);
        dateOfApplication.setHours(dateOfApplication.getHours() + 1);

        const coordinates = [application.latitude, application.longitude]
        const windDirection = application.windDirection
        const lineLength = 0.3

        const coordinatesWithLine = calculateLineCoordinates(coordinates, windDirection, lineLength)
        lineCoordinates.value.push(coordinatesWithLine)

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

        const listItem = document.createElement("tr");
        listItem.innerHTML = `<td> ${application.username ?? '-'}  </td><td> ${application.latitude}, ${application.longitude}</td><td> ${application.windSpeed} м/c </td><td>  ${formattedDate} ${formattedTime} </td>`;
        applicationsList.appendChild(listItem);

        const line = L.polyline(coordinatesWithLine, { color: 'red' }).addTo(map);
        lines.value.push(line); 

        const marker = L.marker(coordinatesWithLine[0], {
          icon: L.icon({
            iconUrl: 'https://leafletjs.com/examples/custom-icons/leaf-green.png',
            iconSize: [38, 95],
            iconAnchor: [22, 94],
            popupAnchor: [-3, -76],
          })
        }).addTo(map);
        markers.value.push(marker); 
      });
    })
    .catch((error) => {
      console.error("Помилка отримання даних:", error);
    });

})


const clearMap = () => {
  markers.value.forEach((marker) => {
    marker.removeFrom(map);
  });
  markers.value = [];

  lines.value.forEach((line) => {
    line.removeFrom(map);
  });
  lines.value = [];
}
</script>

<template>
  <div>
    <div id="mapContainer" style="height: 800px; width: 800px;"></div>

    <h1>Заявки</h1>
    <table id="applications-list">
      <tr><td>Користувач</td><td> відправив заявку з координатами</td><td> швидкістю вітру  м/c </td><td>час створення заявки  </td></tr>
    </table>

    <button @click="clearMap">Очистити карту</button>
  </div>
</template>

<style>
.read-the-docs {
  color: #888;
}

tr td {
  border: 1px #888 solid;
}
</style>