const emotePicker = document.getElementById("emote-picker-0");
const header = document.getElementById("header");

let isDragging = false;
let offsetX, offsetY;

header.addEventListener("mousedown", (e) => {
  isDragging = true;
  offsetX = e.clientX - emotePicker.offsetLeft;
  offsetY = e.clientY - emotePicker.offsetTop;
  header.style.cursor = "grabbing";
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    // Calculate new position
    let x = e.clientX - offsetX;
    let y = e.clientY - offsetY;

    // Get the window's width and height
    const windowWidth = emotePicker.offsetWidth;
    const windowHeight = emotePicker.offsetHeight;

    // Get the max X and Y values to prevent dragging out of the screen
    const maxX = window.innerWidth - windowWidth;
    const maxY = window.innerHeight - windowHeight;

    // Constrain the window's position within the screen
    if (x < 0) x = 0;
    if (x > maxX) x = maxX;
    if (y < 0) y = 0;
    if (y > maxY) y = maxY;

    // Set the new position
    emotePicker.style.left = `${x}px`;
    emotePicker.style.top = `${y}px`;
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
  header.style.cursor = "grab";
});
