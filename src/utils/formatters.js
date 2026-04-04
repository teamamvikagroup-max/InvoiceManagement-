import dayjs from "dayjs";

const ENGLISH_ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const ENGLISH_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const ENGLISH_SCALES = ["", "Thousand", "Lakh", "Crore", "Arab"];

const HINDI_ONES = [
  "",
  "\u090f\u0915",
  "\u0926\u094b",
  "\u0924\u0940\u0928",
  "\u091a\u093e\u0930",
  "\u092a\u093e\u0901\u091a",
  "\u091b\u0939",
  "\u0938\u093e\u0924",
  "\u0906\u0920",
  "\u0928\u094c",
  "\u0926\u0938",
  "\u0917\u094d\u092f\u093e\u0930\u0939",
  "\u092c\u093e\u0930\u0939",
  "\u0924\u0947\u0930\u0939",
  "\u091a\u094c\u0926\u0939",
  "\u092a\u0902\u0926\u094d\u0930\u0939",
  "\u0938\u094b\u0932\u0939",
  "\u0938\u0924\u094d\u0930\u0939",
  "\u0905\u0920\u093e\u0930\u0939",
  "\u0909\u0928\u094d\u0928\u0940\u0938",
  "\u092c\u0940\u0938",
  "\u0907\u0915\u094d\u0915\u0940\u0938",
  "\u092c\u093e\u0908\u0938",
  "\u0924\u0947\u0908\u0938",
  "\u091a\u094c\u092c\u0940\u0938",
  "\u092a\u091a\u094d\u091a\u0940\u0938",
  "\u091b\u092c\u094d\u092c\u0940\u0938",
  "\u0938\u0924\u094d\u0924\u093e\u0908\u0938",
  "\u0905\u091f\u094d\u0920\u093e\u0908\u0938",
  "\u0909\u0928\u0924\u0940\u0938",
  "\u0924\u0940\u0938",
  "\u0907\u0915\u0924\u0940\u0938",
  "\u092c\u0924\u094d\u0924\u0940\u0938",
  "\u0924\u0948\u0902\u0924\u0940\u0938",
  "\u091a\u094c\u0902\u0924\u0940\u0938",
  "\u092a\u0948\u0902\u0924\u0940\u0938",
  "\u091b\u0924\u094d\u0924\u0940\u0938",
  "\u0938\u0948\u0902\u0924\u0940\u0938",
  "\u0905\u095c\u0924\u0940\u0938",
  "\u0909\u0928\u0924\u093e\u0932\u0940\u0938",
  "\u091a\u093e\u0932\u0940\u0938",
  "\u0907\u0915\u0924\u093e\u0932\u0940\u0938",
  "\u092c\u092f\u093e\u0932\u0940\u0938",
  "\u0924\u0948\u0902\u0924\u093e\u0932\u0940\u0938",
  "\u091a\u0935\u093e\u0932\u0940\u0938",
  "\u092a\u0948\u0902\u0924\u093e\u0932\u0940\u0938",
  "\u091b\u093f\u092f\u093e\u0932\u0940\u0938",
  "\u0938\u0948\u0902\u0924\u093e\u0932\u0940\u0938",
  "\u0905\u095c\u0924\u093e\u0932\u0940\u0938",
  "\u0909\u0928\u091a\u093e\u0938",
  "\u092a\u091a\u093e\u0938",
  "\u0907\u0915\u094d\u092f\u093e\u0935\u0928",
  "\u092c\u093e\u0935\u0928",
  "\u0924\u093f\u0930\u0947\u092a\u0928",
  "\u091a\u094c\u0935\u0928",
  "\u092a\u091a\u092a\u0928",
  "\u091b\u092a\u094d\u092a\u0928",
  "\u0938\u0924\u094d\u0924\u093e\u0935\u0928",
  "\u0905\u091f\u094d\u0920\u093e\u0935\u0928",
  "\u0909\u0928\u0938\u0920",
  "\u0938\u093e\u0920",
  "\u0907\u0915\u0938\u0920",
  "\u092c\u093e\u0938\u0920",
  "\u0924\u093f\u0930\u0938\u0920",
  "\u091a\u094c\u0902\u0938\u0920",
  "\u092a\u0948\u0902\u0938\u0920",
  "\u091b\u093f\u092f\u093e\u0938\u0920",
  "\u0938\u095c\u0938\u0920",
  "\u0905\u095c\u0938\u0920",
  "\u0909\u0928\u0939\u0924\u094d\u0924\u0930",
  "\u0938\u0924\u094d\u0924\u0930",
  "\u0907\u0915\u0939\u0924\u094d\u0924\u0930",
  "\u092c\u0939\u0924\u094d\u0924\u0930",
  "\u0924\u093f\u0939\u0924\u094d\u0924\u0930",
  "\u091a\u094c\u0939\u0924\u094d\u0924\u0930",
  "\u092a\u091a\u0939\u0924\u094d\u0924\u0930",
  "\u091b\u093f\u0939\u0924\u094d\u0924\u0930",
  "\u0938\u0924\u0939\u0924\u094d\u0924\u0930",
  "\u0905\u0920\u0939\u0924\u094d\u0924\u0930",
  "\u0909\u0928\u094d\u0928\u093e\u0938\u0940",
  "\u0905\u0938\u094d\u0938\u0940",
  "\u0907\u0915\u094d\u092f\u093e\u0938\u0940",
  "\u092c\u092f\u093e\u0938\u0940",
  "\u0924\u093f\u0930\u093e\u0938\u0940",
  "\u091a\u094c\u0930\u093e\u0938\u0940",
  "\u092a\u091a\u093e\u0938\u0940",
  "\u091b\u093f\u092f\u093e\u0938\u0940",
  "\u0938\u0924\u094d\u0924\u093e\u0938\u0940",
  "\u0905\u091f\u094d\u0920\u093e\u0938\u0940",
  "\u0928\u0935\u093e\u0938\u0940",
  "\u0928\u092c\u094d\u092c\u0947",
  "\u0907\u0915\u094d\u092f\u093e\u0928\u0935\u0947",
  "\u092c\u093e\u0928\u0935\u0947",
  "\u0924\u093f\u0930\u093e\u0928\u0935\u0947",
  "\u091a\u094c\u0930\u093e\u0928\u0935\u0947",
  "\u092a\u091a\u093e\u0928\u0935\u0947",
  "\u091b\u093f\u092f\u093e\u0928\u0935\u0947",
  "\u0938\u0924\u094d\u0924\u093e\u0928\u0935\u0947",
  "\u0905\u091f\u094d\u0920\u093e\u0928\u0935\u0947",
  "\u0928\u093f\u0928\u094d\u092f\u093e\u0928\u0935\u0947",
];

const HINDI_SCALES = ["", "\u0939\u091c\u093e\u0930", "\u0932\u093e\u0916", "\u0915\u0930\u094b\u095c", "\u0905\u0930\u092c"];

function toWholeNumber(value) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue) || numericValue < 0) return 0;
  return numericValue;
}

function formatEnglishBelowHundred(value) {
  if (value < 20) return ENGLISH_ONES[value];
  const tens = Math.floor(value / 10);
  const remainder = value % 10;
  return [ENGLISH_TENS[tens], ENGLISH_ONES[remainder]].filter(Boolean).join(" ");
}

function formatEnglishChunk(value) {
  const hundred = Math.floor(value / 100);
  const remainder = value % 100;
  return [
    hundred ? `${ENGLISH_ONES[hundred]} Hundred` : "",
    remainder ? formatEnglishBelowHundred(remainder) : "",
  ].filter(Boolean).join(" ");
}

function integerToEnglishWords(value) {
  if (value === 0) return "Zero";

  const groups = [];
  let remaining = Math.floor(value);

  groups.push(remaining % 1000);
  remaining = Math.floor(remaining / 1000);

  while (remaining > 0) {
    groups.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  return groups
    .map((groupValue, index) => {
      if (!groupValue) return "";
      const chunk = formatEnglishChunk(groupValue);
      const scale = ENGLISH_SCALES[index];
      return [chunk, scale].filter(Boolean).join(" ");
    })
    .reverse()
    .filter(Boolean)
    .join(" ")
    .trim();
}

function integerToHindiWords(value) {
  const integerValue = Math.floor(value);
  if (integerValue === 0) return "\u0936\u0942\u0928\u094d\u092f";

  const segments = [];
  let remaining = integerValue;
  const units = [remaining % 1000];
  remaining = Math.floor(remaining / 1000);

  while (remaining > 0) {
    units.push(remaining % 100);
    remaining = Math.floor(remaining / 100);
  }

  for (let index = units.length - 1; index >= 0; index -= 1) {
    const segment = units[index];
    if (!segment) continue;

    let segmentText = "";
    if (index === 0 && segment >= 100) {
      const hundreds = Math.floor(segment / 100);
      const remainder = segment % 100;
      segmentText = [
        hundreds ? `${HINDI_ONES[hundreds]} \u0938\u094c` : "",
        remainder ? HINDI_ONES[remainder] : "",
      ].filter(Boolean).join(" ");
    } else {
      segmentText = HINDI_ONES[segment];
    }

    segments.push([segmentText, HINDI_SCALES[index]].filter(Boolean).join(" "));
  }

  return segments.join(" ").trim();
}

function capitalizeSentence(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

export function formatAmountInWordsEnglish(amount) {
  const numericValue = toWholeNumber(amount);
  const rupees = Math.floor(numericValue);
  const paise = Math.round((numericValue - rupees) * 100);
  const rupeeWords = integerToEnglishWords(rupees);
  const paiseWords = paise ? integerToEnglishWords(paise) : "";

  if (!paise) {
    return `Indian Rupees ${capitalizeSentence(rupeeWords)} Only`;
  }

  return `Indian Rupees ${capitalizeSentence(rupeeWords)} and ${capitalizeSentence(paiseWords)} Paise Only`;
}

export function formatAmountInWordsHindi(amount) {
  const numericValue = toWholeNumber(amount);
  const rupees = Math.floor(numericValue);
  const paise = Math.round((numericValue - rupees) * 100);
  const rupeeWords = integerToHindiWords(rupees);
  const paiseWords = paise ? integerToHindiWords(paise) : "";

  if (!paise) {
    return `\u092d\u093e\u0930\u0924\u0940\u092f \u0930\u0941\u092a\u092f\u0947 ${rupeeWords} \u092e\u093e\u0924\u094d\u0930`;
  }

  return `\u092d\u093e\u0930\u0924\u0940\u092f \u0930\u0941\u092a\u092f\u0947 ${rupeeWords} \u0914\u0930 ${paiseWords} \u092a\u0948\u0938\u0947 \u092e\u093e\u0924\u094d\u0930`;
}