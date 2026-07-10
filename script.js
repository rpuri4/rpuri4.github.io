document.querySelector("#year").textContent = new Date().getFullYear();

document.querySelector("#top-button").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
