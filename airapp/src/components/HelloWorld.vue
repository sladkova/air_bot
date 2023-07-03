<script setup>
import { ref, onMounted, computed } from "vue";
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

// defineProps({
//   msg: String,
//   showedInputFilter: Boolean,
//   isFilterApplied: Boolean,
// });

const showedInputFilter = ref(false)

const selectedDateFilterType = ref(null)
const selectedSmellFilterType = ref('');

const isAnyFilterSelected = computed(() => selectedDateFilterType.value != null || selectedSmellFilterType.value !== '')

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
      filterApplications('Day');
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
    listItem.innerHTML = `<td> - </td><td> - </td><td> - </td><td> - </td><td> - </td>`;
    applicationsList.appendChild(listItem);
  }
}

function clearFilters() {
  showedInputFilter.value = false
  selectedSmellFilterType.value = ''

  filterApplications()
}

// dateFilterType: null, Day, Week, Month, Range
function filterApplications(dateFilterType = null) {
  removeChild();
  clearMap();

  const isFilteredBySuggested = dateFilterType !== null && dateFilterType !== 'Range';
  const isFilteredByChoice = dateFilterType === 'Range';

  if (dateFilterType !== 'Range') {
    showedInputFilter.value = false
  }

  selectedDateFilterType.value = dateFilterType

  const applicationsList = document.getElementById("applications-list");

  const lastDayOfPrevWeek = isFilteredBySuggested
    ? moment(new Date())
      .subtract(1, `${dateFilterType}`)
      .endOf(`${dateFilterType}`)
    : null;

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
      if (!moment(application.timestamp).isBetween(choisedDateRange.value[0], choisedDateRange.value[1])) {
        return;
      }
    }

    if (selectedSmellFilterType.value !== ''){
      if (application.kind_of_smell !== selectedSmellFilterType.value) {
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
    } м/c </td><td>  ${formattedDate} ${formattedTime} </td><td> ${application.kind_of_smell ?? "-"}</td>`;
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
        :class="isAnyFilterSelected ? '  visible' : ' invisible'"
      >
        <button
          @click="clearFilters()"
          :class="
            isAnyFilterSelected
              ? ' visible h-[45px] '
              : ' h-[0px] p-[0px] invisible'
          "
          class="transition-all duration-300s"
        >
          Очистити фільтри
        </button>
      </div>
      <div class="flex flex-row justify-evenly">
        <button @click="filterApplications('Day')" :class="{ selected: selectedDateFilterType === 'Day' }">
          За поточний день
        </button>
        <button @click="filterApplications('Week')" :class="{ selected: selectedDateFilterType === 'Week' }">
          За поточний тиждень
        </button>
        <button @click="filterApplications('Month')" :class="{ selected: selectedDateFilterType === 'Month' }">
          За поточний місяць
        </button>
        <button @click="showedInputFilter = !showedInputFilter">
          <p :class="{ hidden: showedInputFilter }">Вибрати дату</p>
          <p :class="{ hidden: !showedInputFilter }">Закрити вибір дати</p>
        </button>
        <select
          data-te-select-init
          data-te-select-placeholder="За типом сморіду"
          v-model="selectedSmellFilterType"
          class="bg-gray-50"
          :class="{ selected: selectedSmellFilterType !== '' }"
          @change="filterApplications(selectedDateFilterType)"
        >
          <option value="">За типом сморіду</option>
          <option value="iod">йод</option>
          <option value="ammonia">аміак</option>
          <option value="hydrogen sulfide">сірководень</option>
          <option value="sulfur">сірка</option>
          <option value="metallurgical fumes">металургійний гар</option>
          <option value="burning plastic">горілий пластик</option>
          <option value="chemicals">хімія</option>
          <option value="decay">гниль</option>
        </select>
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
        @click="filterApplications('Range')"
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
          <td>Тип сморіду</td>
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
