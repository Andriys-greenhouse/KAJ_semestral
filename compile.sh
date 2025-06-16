#!/usr/bin/env bash

DIR_NAME="dist"

tsc && {

TMP=$(mktemp);

for V in $(ls $DIR_NAME); do
    FILE="$DIR_NAME/$V";
    awk '/import/ { match($0, /"\.\/[A-Za-z]+"/); print substr($0, 0, RSTART) "/dist/" substr($0, RSTART+3, RLENGTH-4) ".js\";" } ! /import/ { print $0 }' "$FILE" > "$TMP";
    cat "$TMP" > "$FILE";
done

rm "$TMP";

}

