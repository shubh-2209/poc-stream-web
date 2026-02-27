// shell-app/src/services/eventBus.js
export const eventBus = {
  emit(event, data) {
    window.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  on(event, callback) {
    window.addEventListener(event, e => callback(e.detail));
  }
};
