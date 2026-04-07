import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    public_surfaces: {
      executor: "constant-vus",
      vus: 500,
      duration: "2m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<1200"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:3000";

export default function loadTest() {
  const targets = ["/", "/listings/fishing/nearby", "/auth/login"];
  const target = targets[Math.floor(Math.random() * targets.length)];
  const response = http.get(`${BASE_URL}${target}`);

  check(response, {
    "status is 200": (res) => res.status === 200,
  });

  sleep(1);
}
