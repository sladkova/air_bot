<script setup>
import { ref, onMounted } from "vue";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import moment from "moment/min/moment-with-locales";
import {
  endOfMonth,
  endOfYear,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import "@vuepic/vue-datepicker/dist/main.css";

let dateOfApplication = ref(null);
const lineCoordinates = ref([]);
const markers = ref([]);
const lines = ref([]);
let map;
let fetchedData;

const choisedDateRange = ref();

const presetRanges = ref([
  { label: "Today", range: [new Date(), new Date()] },
  {
    label: "This month",
    range: [startOfMonth(new Date()), endOfMonth(new Date())],
  },
  {
    label: "Last month",
    range: [
      startOfMonth(subMonths(new Date(), 1)),
      endOfMonth(subMonths(new Date(), 1)),
    ],
  },
  {
    label: "This year",
    range: [startOfYear(new Date()), endOfYear(new Date())],
  },
  {
    label: "This year (slot)",
    range: [startOfYear(new Date()), endOfYear(new Date())],
    slot: "yearly",
  },
]);

const calculateLineCoordinates = (
  pointCoordinates,
  windDirection,
  lineLength
) => {
  const windDirectionRad = windDirection * (Math.PI / 180);
  const endPointLat =
    pointCoordinates[0] + (lineLength / 111.12) * Math.cos(windDirectionRad); // Перетворення відстані на координати
  const endPointLng =
    pointCoordinates[1] +
    (lineLength / (111.12 * Math.cos(pointCoordinates[0] * (Math.PI / 180)))) *
      Math.sin(windDirectionRad); // Перетворення відстані на координати
  return [pointCoordinates, [endPointLat, endPointLng]];
};

defineProps({
  msg: String,
  showedInputFilter: Boolean,
  isFilterApplied: Boolean,
});
onMounted(() => {
  map = L.map("mapContainer", {
    center: [47.8388, 35.1396], // Координати Запоріжжя
    zoom: 10, // Рівень масштабування
    trackResize: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}", {
    foo: "bar",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
  }).addTo(map);

  fetch("https://zpspace.com.ua/api/airdata")
    .then((response) => response.json())
    .then((data) => {
      fetchedData = data;
      filterByDate(false);
    })
    .catch((error) => {
      console.error("Помилка отримання даних:", error);
    });
});

const clearMap = () => {
  markers.value.forEach((marker) => {
    marker.removeFrom(map);
  });
  markers.value = [];

  lines.value.forEach((line) => {
    line.removeFrom(map);
  });
  lines.value = [];
};

function removeChild() {
  const applicationsList = document.getElementById("applications-list");
  const clarificationList = document.getElementById("clarification");
  while (applicationsList.lastChild != clarificationList) {
    applicationsList.removeChild(applicationsList.lastChild);
  }
}

function checkIfTheTableIsEmpty() {
  const applicationsList = document.getElementById("applications-list");
  const clarificationList = document.getElementById("clarification");
  if (applicationsList.lastChild == clarificationList) {
    console.log("empty");
    const listItem = document.createElement("tr");
    listItem.innerHTML = `<td> - </td><td> - </td><td> - </td><td> - </td>`;
    applicationsList.appendChild(listItem);
  }
}

function filterByDate(
  isFilteredBySuggested = false,
  NeededFilter = "day",
  isFilteredByChoice = false,
  startDate = new Date(),
  endDate = new Date()
) {
  removeChild();
  clearMap();

  const applicationsList = document.getElementById("applications-list");

  const lastDayOfPrevWeek = moment(new Date())
    .subtract(1, `${NeededFilter}`)
    .endOf(`${NeededFilter}`);

  fetchedData.forEach((application) => {
    if (isFilteredBySuggested) {
      if (
        !moment(application.timestamp).isBetween(
          lastDayOfPrevWeek._d,
          lastDayOfPrevWeek._i
        )
      ) {
        return;
      }
    }
    if (isFilteredByChoice) {
      if (!moment(application.timestamp).isBetween(startDate, endDate)) {
        return;
      }
    }
    dateOfApplication = new Date(application.timestamp);
    dateOfApplication.setHours(dateOfApplication.getHours() + 1);

    const coordinates = [application.latitude, application.longitude];
    const windDirection = application.windDirection;
    const lineDistance = 10; // Відстань у кілометрах

    const coordinatesWithLine = calculateLineCoordinates(
      coordinates,
      windDirection,
      lineDistance
    );
    lineCoordinates.value.push(coordinatesWithLine);

    const formattedDate = dateOfApplication.toLocaleString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = dateOfApplication.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });

    const listItem = document.createElement("tr");
    listItem.innerHTML = `<td> ${application.username ?? "-"}  </td><td> ${
      application.latitude
    }, ${application.longitude}</td><td> ${
      application.windSpeed
    } м/c </td><td>  ${formattedDate} ${formattedTime} </td>`;
    applicationsList.appendChild(listItem);

    const line = L.polyline(coordinatesWithLine, { color: "red" }).addTo(map);
    lines.value.push(line);

    const marker = L.circleMarker(coordinatesWithLine[0], {
      radius: 4,
      fillColor: "white",
      color: "black",
      weight: 1,
      opacity: 1,
      fillOpacity: 1,
    }).addTo(map);
    markers.value.push(marker);
  });
  checkIfTheTableIsEmpty();
}
</script>

<template>
  <div class="flex flex-col gap-y-[20px]">
    <div id="mapContainer" style="height: 800px; width: 800px"></div>
    <h1>Заявки</h1>
    <div class="flex flex-col gap-y-[10px]">
      <h3>Фільтри:</h3>
      <div
        class="flex justify-center transition-all duration-300"
        :class="isFilterApplied ? '  visible' : ' invisible'"
      >
        <button
          @click="filterByDate(), (isFilterApplied = false)"
          :class="
            isFilterApplied
              ? ' visible h-[45px] '
              : ' h-[0px] p-[0px] invisible'
          "
          class="transition-all duration-300s"
        >
          Очистити фільтри
        </button>
      </div>
      <div class="flex flex-row justify-evenly">
        <button @click="filterByDate(true, 'Day'), (isFilterApplied = true)">
          За поточний день
        </button>
        <button @click="filterByDate(true, 'Week'), (isFilterApplied = true)">
          За поточну неділю
        </button>
        <button @click="filterByDate(true, 'Month'), (isFilterApplied = true)">
          За поточний місяць
        </button>
        <button @click="showedInputFilter = !showedInputFilter">
          <p :class="{ hidden: showedInputFilter }">Вибрати дату</p>
          <p :class="{ hidden: !showedInputFilter }">Закрити вибір дати</p>
        </button>
      </div>
    </div>
    <div
      class="flex flex-row justify-center items-center transition-all gap-x-[30px]"
      :class="showedInputFilter ? 'h-[50px] visible' : 'h-[0px] invisible'"
    >
      <VueDatePicker
        v-model="choisedDateRange"
        range
        :preset-ranges="presetRanges"
        auto-apply
      >
        <template #yearly="{ label, range, presetDateRange }">
          <span @click="presetDateRange(range)">{{ label }}</span>
        </template>
      </VueDatePicker>
      <button
        :class="showedInputFilter ? ' visible' : ' invisible'"
        @click="
          filterByDate(
            false,
            '',
            true,
            choisedDateRange[0],
            choisedDateRange[1]
          ),
            (isFilterApplied = true)
        "
      >
        Знайти
      </button>
    </div>
    <div class="flex flex-col">
      <table id="applications-list">
        <tr id="clarification">
          <td>Користувач</td>
          <td>Відправив заявку з координатами</td>
          <td>Швидкість вітру</td>
          <td>Час створення заявки</td>
        </tr>
      </table>
    </div>
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
