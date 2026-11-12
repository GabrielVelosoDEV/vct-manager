# Minimapas oficiais (sem texto) — para deixar os mapas fiéis

O minimapa que o próprio jogo usa, sem etiquetas por cima. Com ele a extração sai
sem os buracos das etiquetas, e a escala fica exata (a valorant-api informa quantos
metros cada pixel tem).

Baixe cada link e salve **nesta pasta** com o nome da esquerda (PNG):

- [ ] `abyss.png` — https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png
- [ ] `ascent.png` — https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png
- [ ] `bind.png` — https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png
- [ ] `breeze.png` — https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png
- [ ] `corrode.png` — https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png
- [ ] `fracture.png` — https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png
- [ ] `haven.png` — https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png
- [ ] `icebox.png` — https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png
- [ ] `lotus.png` — https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png
- [ ] `pearl.png` — https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png
- [ ] `split.png` — https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png
- [ ] `summit.png` — https://media.valorant-api.com/maps/756da597-416b-c0f2-f47b-afbdf28670bc/displayicon.png
- [ ] `sunset.png` — https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png

Depois é só avisar o Claude: `tools/mapas/extrair.py` passa a usar estes no lugar
dos minimapas com nomes (`tools/mapas/minimapas/`).
