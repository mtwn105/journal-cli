// Read browser cookies
// const cookies = req.headers.cookie;

const accessToken = getCookie("access_token");

// Update input value with access token
const input = document.getElementById("token");
input.value = accessToken;

async function copy() {
  // Copy access token to clipboard
  await navigator.clipboard.writeText(input.value);

  // Show success message
  const p = document.getElementById("success");
  p.style = "display: block";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}
