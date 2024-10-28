s = "12:01:00PM";

function timeConversion(s) {
  // Extract hours, minutes, seconds, and AM/PM indicator
  let [hours, minutes, secondsAMPM] = s.split(":");
  const seconds = secondsAMPM.slice(0, 2);
  const ampm = secondsAMPM.slice(2);
  console.log(hours, minutes, seconds, ampm);
  // Convert hours to number
  hours = parseInt(hours);

  // Convert to 24-hour format
  if (ampm.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (ampm.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  // Format the result
  return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
}

console.log(timeConversion(s));

function multiplesOf3Or5(number) {
  let summation = 0;
  for (let i = 0; i < number; i++) {
    if (i % 3 === 0 || i % 5 === 0) {
      summation += i;
    }
  }
  return summation;
}

console.log(multiplesOf3Or5(49));
