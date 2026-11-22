#!/bin/bash
# Todos os mapas em paralelo (um processo por núcleo). Uso: tools/balanco-gameplay.sh [N] [pasta]
N=${1:-6}; D=${2:-/tmp/balanco-gameplay}; mkdir -p "$D"
cd "$(dirname "$0")/.."
node -e "const vm=require('vm');const c={};vm.createContext(c);vm.runInContext(require('fs').readFileSync('data/gameplay/mapas.js','utf8')+';globalThis.K=Object.keys(MAPAS_GAMEPLAY)',c);console.log(c.K.join('\n'))" > "$D/lista.txt"
cat "$D/lista.txt" | xargs -P "$(nproc)" -I{} sh -c "node tools/balanco-gameplay.mjs {} $N --json > $D/{}.json 2>&1"
node tools/balanco-gameplay-resumo.mjs "$D"/*.json
