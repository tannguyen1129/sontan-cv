#!/usr/bin/env bash
set -euo pipefail

base_url="${CDN_TEST_BASE_URL:-https://graduation.sontan.info}"
action="${1:-help}"
amount="${2:-}"

validate_amount() {
  if [[ ! "${amount}" =~ ^[0-9]+$ ]] || (( amount < 1 || amount > 10000 )); then
    echo "Số lượng phải nằm trong khoảng 1-10000." >&2
    exit 1
  fi
}

url_for() {
  local group="$1"
  local index="$2"
  printf '%s/cdn-test/%s/object-%05d.svg' "${base_url}" "${group}" "${index}"
}

generate_urls() {
  local group="$1"
  local count="$2"
  local index
  for ((index=1; index<=count; index++)); do
    url_for "${group}" "${index}"
    printf '\n'
  done
}

warm_urls() {
  local group="$1"
  local count="$2"
  generate_urls "${group}" "${count}" |
    xargs -n 1 -P 20 curl -fsS --max-time 20 -o /dev/null
  # Request a second time so the test begins from a warm state.
  generate_urls "${group}" "${count}" |
    xargs -n 1 -P 20 curl -fsS --max-time 20 -o /dev/null
  echo "Đã warm ${count} object trong /cdn-test/${group}/"
}

inspect_group() {
  local group="$1"
  local count="$2"
  local work_dir result_file
  work_dir=$(mktemp -d)
  result_file="${work_dir}/states"
  export base_url group result_file
  export -f url_for
  seq 1 "${count}" | xargs -P "${CDN_TEST_CONCURRENCY:-40}" -I {} bash -c '
    headers=$(curl -fsS -D - --max-time 20 -o /dev/null "$(url_for "$group" "{}")" | tr -d "\r") || { echo UNKNOWN >> "$result_file"; exit; }
    cache_state=$(printf "%s\n" "$headers" | awk -F": " '\''tolower($1)=="x-cache"{print toupper($2); exit}'\'')
    age=$(printf "%s\n" "$headers" | awk -F": " '\''tolower($1)=="age"{print $2; exit}'\'')
    if [[ "$cache_state" == *HIT* ]] || [[ "${age:-}" =~ ^[1-9][0-9]*$ ]]; then echo HIT >> "$result_file"
    elif [[ "$cache_state" == *MISS* ]] || [[ "${age:-0}" == 0 ]]; then echo MISS >> "$result_file"
    else echo UNKNOWN >> "$result_file"; fi
  '
  local hit miss unknown
  hit=$(awk '$0=="HIT"{n++} END{print n+0}' "${result_file}")
  miss=$(awk '$0=="MISS"{n++} END{print n+0}' "${result_file}")
  unknown=$(awk '$0=="UNKNOWN"{n++} END{print n+0}' "${result_file}")
  rm -rf -- "${work_dir}"
  echo "Kết quả ${group}: HIT=${hit} MISS=${miss} UNKNOWN=${unknown} TOTAL=${count}"
}

case "${action}" in
  urls)
    validate_amount
    generate_urls "url-${amount}" "${amount}"
    ;;
  warm-url)
    validate_amount
    warm_urls "url-${amount}" "${amount}"
    ;;
  check-url)
    validate_amount
    inspect_group "url-${amount}" "${amount}"
    ;;
  warm-folder)
    validate_amount
    warm_urls "folder-${amount}" "${amount}"
    ;;
  check-folder)
    validate_amount
    inspect_group "folder-${amount}" "${amount}"
    ;;
  prefix)
    validate_amount
    printf '/cdn-test/folder-%s/\n' "${amount}"
    ;;
  *)
    cat <<'HELP'
CDN purge limit test

URL cụ thể:
  ./cdn-purge-test.sh warm-url 10
  ./cdn-purge-test.sh urls 10        # copy kết quả vào Purge By URL
  ./cdn-purge-test.sh check-url 10

Theo folder/prefix:
  ./cdn-purge-test.sh warm-folder 500
  ./cdn-purge-test.sh prefix 500     # copy kết quả vào Purge By Prefix
  ./cdn-purge-test.sh check-folder 500

Có thể thử mọi mức từ 1 đến 10000 object, ví dụ:
  URL:    1, 10, 50, 100, 500, 1000, 5000, 10000
  Folder: 100, 500, 1000, 5000, 10000

Đo purge tự động bằng API và theo dõi đến khi MISS:
  node cdn-api-test.js measure-url 100
  node cdn-api-test.js measure-prefix 10000
HELP
    ;;
esac
