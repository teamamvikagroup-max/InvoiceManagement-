import dayjs from "dayjs";

export function formatDate(value, format = "DD MMM YYYY") {
  return value ? dayjs(value).format(format) : "-";
}

export function formatTimestamp(value) {
  if (!value) return "Pending sync";
  if (value?.seconds) return dayjs.unix(value.seconds).format("DD MMM YYYY");
  if (typeof value === "number") return dayjs(value).format("DD MMM YYYY");
  return dayjs(value).format("DD MMM YYYY");
}

export function formatWebsite(url) {
  if (!url) return "";
  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}
