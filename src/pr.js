let now = new Date(); // Create a new Date object for the current date and time

// Get the full date
let fullDate = now.toDateString(); // Example: "Tue Oct 31 2023"

// Get the day of the week
let dayOfWeek = now.getDay(); // Returns a number (0 = Sunday, 1 = Monday, ..., 6 = Saturday)

// Convert day number to a readable name
let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
let dayName = days[dayOfWeek]; // Example: "Tuesday"

// Get the time
let hours = now.getHours(); // Example: 14 (2 PM in 24-hour format)
let minutes = now.getMinutes(); // Example: 30
let seconds = now.getSeconds(); // Example: 45

// Format the time (optional, to make it look nicer)
let formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

// Log the results
console.log("Full Date:", fullDate); // Example: "Tue Oct 31 2023"
console.log("Day of the Week:", dayName); // Example: "Tuesday"
console.log("Time:", minutes); // Example: "14:30:45"
console.log(now.getDate()+now.getMonth())