/* Browser assertions are intentional here: app.js is a DOM-bound IIFE and the
   diary contract depends on rendered date/butler grouping, not migration data
   alone. Add ?assert=1 to a fixture URL to run its contract checks in-place. */
window.runFixtureAssertions = function runFixtureAssertions({ target, check }) {
  const start = () => {
    document.body.innerHTML = '<main style="font:16px/1.5 sans-serif;padding:24px"><h1>Fixture assertions</h1><p id="fixture-result">RUNNING</p><ol id="fixture-checks"></ol></main>';
    const frame = document.createElement("iframe");
    frame.hidden = true;
    frame.src = target;
    document.body.append(frame);
    frame.addEventListener("load", async () => {
      const messages = [];
      const assert = (condition, message, actual) => {
        if (!condition) throw new Error(`${message}${actual === undefined ? "" : `: ${JSON.stringify(actual)}`}`);
        messages.push(message);
      };
      assert.equal = (actual, expected, message) => assert(Object.is(actual, expected), message, { expected, actual });
      try {
        await check(frame, assert, milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
        document.documentElement.dataset.fixtureStatus = "pass";
        document.querySelector("#fixture-result").textContent = `PASS · ${messages.length} checks`;
      } catch (error) {
        document.documentElement.dataset.fixtureStatus = "fail";
        document.querySelector("#fixture-result").textContent = `FAIL · ${error.message}`;
      }
      document.querySelector("#fixture-checks").innerHTML = messages.map(message => `<li>${message}</li>`).join("");
    }, { once: true });
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
};
