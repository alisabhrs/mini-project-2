const fridgeButton = document.getElementById("fridge-button");
const fridgeHint = document.querySelector(".fridge-hint");

fridgeButton.addEventListener("click", () => {
  const isOpen = fridgeButton.classList.toggle("open");

  fridgeButton.setAttribute("aria-expanded", String(isOpen));
  fridgeButton.setAttribute(
    "aria-label",
    isOpen ? "Close refrigerator" : "Open refrigerator"
  );

  fridgeHint.textContent = isOpen
    ? "CLICK TO CLOSE"
    : "CLICK TO OPEN";
});
