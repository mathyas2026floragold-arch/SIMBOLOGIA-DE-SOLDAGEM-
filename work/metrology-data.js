(function(root){
  'use strict';
  const questions=[
  {
    "id": 1,
    "question": "O que a metrologia estuda e realiza?",
    "options": [
      "Somente a soldagem de metais.",
      "Medições e comparações baseadas em padrões.",
      "Somente a pressão dos gases.",
      "A composição dos eletrodos."
    ],
    "explanation": "Metrologia é a ciência da medição e de suas aplicações. Inclui métodos, instrumentos, unidades e a avaliação dos resultados.",
    "section": 1,
    "answer": 1,
    "lesson": "metrology"
  },
  {
    "id": 2,
    "question": "Na preparação de uma junta para soldar, uma aplicação da metrologia é:",
    "options": [
      "Escolher a cor da chapa.",
      "Ajustar a marca da máquina.",
      "Conferir ângulo de chanfro e abertura da junta.",
      "Identificar a composição química do gás."
    ],
    "explanation": "Medidas de ângulo de chanfro e abertura da junta fazem parte do controle dimensional.",
    "section": 1,
    "answer": 2,
    "lesson": "dimensional"
  },
  {
    "id": 3,
    "question": "Qual instrumento tem fita flexível e graduada?",
    "options": [
      "Régua graduada.",
      "Manômetro.",
      "Calibre de solda.",
      "Trena."
    ],
    "explanation": "A trena é uma fita flexível graduada, indicada para medir distâncias e comprimentos.",
    "section": 1,
    "answer": 3,
    "lesson": "rulers"
  },
  {
    "id": 4,
    "question": "Para verificar rapidamente uma medida curta sem exigir alta precisão, a melhor escolha é:",
    "options": [
      "Escala graduada.",
      "Manômetro.",
      "Gabarito de chanfro.",
      "Calibre de solda."
    ],
    "explanation": "A escala graduada (régua) é usada para medições lineares rápidas e de menor extensão.",
    "section": 1,
    "answer": 0,
    "lesson": "rulers"
  },
  {
    "id": 5,
    "question": "Qual instrumento é mais adequado para medir com maior precisão a espessura de uma chapa?",
    "options": [
      "Trena.",
      "Paquímetro.",
      "Manômetro.",
      "Gabarito de solda."
    ],
    "explanation": "O paquímetro realiza medições lineares mais precisas, inclusive espessuras externas.",
    "section": 1,
    "answer": 1,
    "lesson": "caliper"
  },
  {
    "id": 6,
    "question": "Quais são os componentes básicos de leitura de um paquímetro com nônio?",
    "options": [
      "Ponteiro e mola.",
      "Fita e gancho.",
      "Escala fixa e cursor móvel com nônio.",
      "Mangueira e regulador."
    ],
    "explanation": "O paquímetro é composto pela escala fixa e pelo cursor móvel que traz o nônio.",
    "section": 1,
    "answer": 2,
    "lesson": "caliper"
  },
  {
    "id": 7,
    "question": "Para medir o diâmetro externo de uma barra, qual tipo de medição do paquímetro é usado?",
    "options": [
      "Externa.",
      "Interna.",
      "Profundidade.",
      "Ressalto."
    ],
    "explanation": "Diâmetros externos e espessuras são medidas externas.",
    "section": 1,
    "answer": 0,
    "lesson": "external"
  },
  {
    "id": 8,
    "question": "Para medir o diâmetro interno de um furo, qual tipo de medição do paquímetro é usado?",
    "options": [
      "Externa.",
      "Profundidade.",
      "Ressalto.",
      "Interna."
    ],
    "explanation": "As medições internas permitem conferir furos e rasgos internos.",
    "section": 1,
    "answer": 3,
    "lesson": "internal"
  },
  {
    "id": 9,
    "question": "Qual recurso do paquímetro é utilizado para medir a profundidade de um furo cego?",
    "options": [
      "Gancho da trena.",
      "Haste de profundidade.",
      "Corpo do manômetro.",
      "Face do gabarito."
    ],
    "explanation": "A haste do paquímetro permite aferir profundidades e rebaixos.",
    "section": 1,
    "answer": 1,
    "lesson": "depth"
  },
  {
    "id": 10,
    "question": "Ao medir uma diferença de nível entre duas superfícies com o paquímetro, realiza-se uma medição de:",
    "options": [
      "Pressão.",
      "Comprimento de fita.",
      "Ressalto.",
      "Ângulo."
    ],
    "explanation": "Ressaltos são diferenças de nível ou degraus na peça.",
    "section": 1,
    "answer": 2,
    "lesson": "step"
  },
  {
    "id": 11,
    "question": "Qual instrumento mede a pressão de gases ou fluidos?",
    "options": [
      "Manômetro.",
      "Paquímetro.",
      "Trena.",
      "Régua graduada."
    ],
    "explanation": "O manômetro mensura a pressão de líquidos e gases.",
    "section": 1,
    "answer": 0,
    "lesson": "pressure"
  },
  {
    "id": 12,
    "question": "Na soldagem TIG e MIG/MAG, o manômetro ajuda a acompanhar:",
    "options": [
      "A espessura da chapa.",
      "O ângulo da tocha.",
      "A largura do cordão.",
      "A pressão do gás de proteção."
    ],
    "explanation": "O manômetro indica pressão. A vazão do gás de proteção é uma grandeza diferente, acompanhada com fluxômetro ou medidor de vazão.",
    "section": 1,
    "answer": 3,
    "lesson": "pressure"
  },
  {
    "id": 13,
    "question": "Uma proteção gasosa inadequada pode favorecer:",
    "options": [
      "Melhor alinhamento da junta.",
      "Porosidades e falhas no cordão.",
      "Redução garantida da deformação.",
      "Melhor leitura do nônio."
    ],
    "explanation": "A proteção gasosa inadequada pode permitir contaminação do banho e favorecer porosidade; por isso é importante verificar o sistema e a vazão especificada.",
    "section": 1,
    "answer": 1,
    "lesson": "gas"
  },
  {
    "id": 14,
    "question": "Qual instrumento verifica a altura da coroa ou sobre-espessura do cordão?",
    "options": [
      "Trena.",
      "Manômetro.",
      "Calibre de solda.",
      "Régua de aço."
    ],
    "explanation": "O calibre de solda mede características geométricas do cordão, incluindo a altura da coroa.",
    "section": 1,
    "answer": 2,
    "lesson": "weld"
  },
  {
    "id": 15,
    "question": "Além da altura da coroa, o calibre de solda pode conferir:",
    "options": [
      "Ângulos e largura do perfil soldado.",
      "Pressão de saída do cilindro.",
      "Corrente elétrica da máquina.",
      "Composição do metal de base."
    ],
    "explanation": "O calibre de solda permite verificar ângulos e dimensões do perfil executado.",
    "section": 1,
    "answer": 0,
    "lesson": "weld"
  },
  {
    "id": 16,
    "question": "Antes da soldagem, um gabarito pode ser utilizado para:",
    "options": [
      "Ajustar a vazão elétrica.",
      "Medir pressão de fluido.",
      "Medir exclusivamente comprimentos longos.",
      "Comparar formas e conferir posicionamento."
    ],
    "explanation": "Gabaritos comparam formas, ângulos e ajudam no alinhamento antes de soldar.",
    "section": 1,
    "answer": 3,
    "lesson": "templates"
  },
  {
    "id": 17,
    "question": "Após soldar, o uso de um gabarito pode auxiliar a conferir:",
    "options": [
      "A tensão da rede elétrica.",
      "Deformações em relação ao limite estabelecido.",
      "A pureza do gás.",
      "A temperatura do ambiente."
    ],
    "explanation": "Gabaritos podem verificar se as deformações resultantes não ultrapassaram limites.",
    "section": 1,
    "answer": 1,
    "lesson": "templates"
  },
  {
    "id": 18,
    "question": "Qual alternativa diferencia corretamente a trena da escala graduada?",
    "options": [
      "Ambas medem apenas pressão.",
      "A trena usa nônio e a régua usa cursor.",
      "A trena é fita flexível; a escala graduada é régua rígida.",
      "A escala graduada mede gás e a trena mede solda."
    ],
    "explanation": "A trena tem fita flexível; a escala graduada normalmente é uma régua metálica rígida.",
    "section": 1,
    "answer": 2,
    "lesson": "rulers"
  },
  {
    "id": 19,
    "question": "Converta 3,175 mm em polegada fracionária.",
    "options": [
      "1/4\"",
      "1/8\"",
      "3/8\"",
      "3/16\""
    ],
    "explanation": "3,175 ÷ 25,4 = 0,125\" = 1/8\".",
    "section": 2,
    "answer": 1,
    "lesson": "conversion"
  },
  {
    "id": 20,
    "question": "Converta 6,35 mm em polegada fracionária.",
    "options": [
      "1/8\"",
      "1/4\"",
      "3/8\"",
      "1/2\""
    ],
    "explanation": "6,35 ÷ 25,4 = 0,25\" = 1/4\".",
    "section": 2,
    "answer": 1,
    "lesson": "conversion"
  },
  {
    "id": 21,
    "question": "Converta 9,525 mm em polegada fracionária.",
    "options": [
      "1/4\"",
      "1/2\"",
      "5/8\"",
      "3/8\""
    ],
    "explanation": "9,525 ÷ 25,4 = 0,375\" = 3/8\".",
    "section": 2,
    "answer": 3,
    "lesson": "conversion"
  },
  {
    "id": 22,
    "question": "Converta 12,7 mm em polegada fracionária.",
    "options": [
      "1/2\"",
      "3/8\"",
      "5/8\"",
      "3/4\""
    ],
    "explanation": "12,7 ÷ 25,4 = 0,5\" = 1/2\".",
    "section": 2,
    "answer": 0,
    "lesson": "conversion"
  },
  {
    "id": 23,
    "question": "Converta 15,875 mm em polegada fracionária.",
    "options": [
      "1/2\"",
      "3/4\"",
      "5/8\"",
      "7/8\""
    ],
    "explanation": "15,875 ÷ 25,4 = 0,625\" = 5/8\".",
    "section": 2,
    "answer": 2,
    "lesson": "conversion"
  },
  {
    "id": 24,
    "question": "Converta 19,05 mm em polegada fracionária.",
    "options": [
      "5/8\"",
      "7/8\"",
      "3/4\"",
      "1\""
    ],
    "explanation": "19,05 ÷ 25,4 = 0,75\" = 3/4\".",
    "section": 2,
    "answer": 2,
    "lesson": "conversion"
  },
  {
    "id": 25,
    "question": "Converta 22,225 mm em polegada fracionária.",
    "options": [
      "7/8\"",
      "3/4\"",
      "1\"",
      "9/8\""
    ],
    "explanation": "22,225 ÷ 25,4 = 0,875\" = 7/8\".",
    "section": 2,
    "answer": 0,
    "lesson": "conversion"
  },
  {
    "id": 26,
    "question": "Converta 25,4 mm em polegadas.",
    "options": [
      "7/8\"",
      "9/8\"",
      "5/4\"",
      "1\""
    ],
    "explanation": "25,4 ÷ 25,4 = 1\" = 1\".",
    "section": 2,
    "answer": 3,
    "lesson": "conversion"
  },
  {
    "id": 27,
    "question": "Converta 1/16\" em milímetros.",
    "options": [
      "3,1750 mm",
      "1,5875 mm",
      "1,9050 mm",
      "4,7625 mm"
    ],
    "explanation": "(1 ÷ 16) × 25,4 = 1,5875 mm.",
    "section": 2,
    "answer": 1,
    "lesson": "conversion"
  },
  {
    "id": 28,
    "question": "Converta 5/16\" em milímetros.",
    "options": [
      "9,5250 mm",
      "7,9375 mm",
      "8,2550 mm",
      "11,1125 mm"
    ],
    "explanation": "(5 ÷ 16) × 25,4 = 7,9375 mm.",
    "section": 2,
    "answer": 1,
    "lesson": "conversion"
  },
  {
    "id": 29,
    "question": "Converta 11/16\" em milímetros.",
    "options": [
      "19,0500 mm",
      "17,7800 mm",
      "20,6375 mm",
      "17,4625 mm"
    ],
    "explanation": "(11 ÷ 16) × 25,4 = 17,4625 mm.",
    "section": 2,
    "answer": 3,
    "lesson": "conversion"
  },
  {
    "id": 30,
    "question": "Converta 1 1/4\" em milímetros.",
    "options": [
      "31,75 mm",
      "33,3375 mm",
      "32,0675 mm",
      "34,9250 mm"
    ],
    "explanation": "(5 ÷ 4) × 25,4 = 31,75 mm.",
    "section": 2,
    "answer": 0,
    "lesson": "conversion"
  },
  {
    "id": 31,
    "question": "Escala principal: 14 mm | nônio: 7ª divisão coincide. Determine a medida final.",
    "options": [
      "14,40 mm",
      "14,30 mm",
      "14,35 mm",
      "14,85 mm"
    ],
    "explanation": "14 + (7 × 0,05) = 14 + 0,35 = 14,35 mm.",
    "section": 3,
    "answer": 2,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "14",
      "vernierIndex": 7
    }
  },
  {
    "id": 32,
    "question": "Escala principal: 8 mm | nônio: 11ª divisão coincide. Determine a medida final.",
    "options": [
      "8,60 mm",
      "8,50 mm",
      "8,55 mm",
      "9,05 mm"
    ],
    "explanation": "8 + (11 × 0,05) = 8 + 0,55 = 8,55 mm.",
    "section": 3,
    "answer": 2,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "8",
      "vernierIndex": 11
    }
  },
  {
    "id": 33,
    "question": "Escala principal: 26 mm | nônio: 4ª divisão coincide. Determine a medida final.",
    "options": [
      "26,20 mm",
      "26,25 mm",
      "26,15 mm",
      "26,70 mm"
    ],
    "explanation": "26 + (4 × 0,05) = 26 + 0,20 = 26,20 mm.",
    "section": 3,
    "answer": 0,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "26",
      "vernierIndex": 4
    }
  },
  {
    "id": 34,
    "question": "Escala principal: 37 mm | nônio: 15ª divisão coincide. Determine a medida final.",
    "options": [
      "37,80 mm",
      "37,70 mm",
      "38,25 mm",
      "37,75 mm"
    ],
    "explanation": "37 + (15 × 0,05) = 37 + 0,75 = 37,75 mm.",
    "section": 3,
    "answer": 3,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "37",
      "vernierIndex": 15
    }
  },
  {
    "id": 35,
    "question": "Escala principal: 3 mm | nônio: 19ª divisão coincide. Determine a medida final.",
    "options": [
      "4,00 mm",
      "3,95 mm",
      "3,90 mm",
      "4,45 mm"
    ],
    "explanation": "3 + (19 × 0,05) = 3 + 0,95 = 3,95 mm.",
    "section": 3,
    "answer": 1,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "3",
      "vernierIndex": 19
    }
  },
  {
    "id": 36,
    "question": "Escala principal: 52 mm | nônio: 2ª divisão coincide. Determine a medida final.",
    "options": [
      "52,15 mm",
      "52,10 mm",
      "52,05 mm",
      "52,60 mm"
    ],
    "explanation": "52 + (2 × 0,05) = 52 + 0,10 = 52,10 mm.",
    "section": 3,
    "answer": 1,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "52",
      "vernierIndex": 2
    }
  },
  {
    "id": 37,
    "question": "Escala principal: 18 mm | nônio: 9ª divisão coincide. Determine a medida final.",
    "options": [
      "18,50 mm",
      "18,40 mm",
      "18,95 mm",
      "18,45 mm"
    ],
    "explanation": "18 + (9 × 0,05) = 18 + 0,45 = 18,45 mm.",
    "section": 3,
    "answer": 3,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "18",
      "vernierIndex": 9
    }
  },
  {
    "id": 38,
    "question": "Escala principal: 61 mm | nônio: 12ª divisão coincide. Determine a medida final.",
    "options": [
      "61,60 mm",
      "61,65 mm",
      "61,55 mm",
      "62,10 mm"
    ],
    "explanation": "61 + (12 × 0,05) = 61 + 0,60 = 61,60 mm.",
    "section": 3,
    "answer": 0,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "61",
      "vernierIndex": 12
    }
  },
  {
    "id": 39,
    "question": "Escala principal: 44 mm | nônio: 6ª divisão coincide. Determine a medida final.",
    "options": [
      "44,35 mm",
      "44,25 mm",
      "44,30 mm",
      "44,80 mm"
    ],
    "explanation": "44 + (6 × 0,05) = 44 + 0,30 = 44,30 mm.",
    "section": 3,
    "answer": 2,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "44",
      "vernierIndex": 6
    }
  },
  {
    "id": 40,
    "question": "Escala principal: 9 mm | nônio: 18ª divisão coincide. Determine a medida final.",
    "options": [
      "9,95 mm",
      "9,85 mm",
      "9,90 mm",
      "10,40 mm"
    ],
    "explanation": "9 + (18 × 0,05) = 9 + 0,90 = 9,90 mm.",
    "section": 3,
    "answer": 2,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "9",
      "vernierIndex": 18
    }
  },
  {
    "id": 41,
    "question": "Escala principal: 1/16\" | nônio: 3ª divisão coincide. Determine a leitura final.",
    "options": [
      "11/128\"",
      "3/32\"",
      "5/64\"",
      "19/128\""
    ],
    "explanation": "8/128\" + 3/128\" = 11/128\" = 11/128\".",
    "section": 4,
    "answer": 0,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "1/16",
      "vernierIndex": 3
    }
  },
  {
    "id": 42,
    "question": "Escala principal: 3/16\" | nônio: 5ª divisão coincide. Determine a leitura final.",
    "options": [
      "15/64\"",
      "7/32\"",
      "37/128\"",
      "29/128\""
    ],
    "explanation": "24/128\" + 5/128\" = 29/128\" = 29/128\".",
    "section": 4,
    "answer": 3,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "3/16",
      "vernierIndex": 5
    }
  },
  {
    "id": 43,
    "question": "Escala principal: 7/16\" | nônio: 2ª divisão coincide. Determine a leitura final.",
    "options": [
      "59/128\"",
      "29/64\"",
      "57/128\"",
      "33/64\""
    ],
    "explanation": "56/128\" + 2/128\" = 58/128\" = 29/64\".",
    "section": 4,
    "answer": 1,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "7/16",
      "vernierIndex": 2
    }
  },
  {
    "id": 44,
    "question": "Escala principal: 1/2\" | nônio: 7ª divisão coincide. Determine a leitura final.",
    "options": [
      "9/16\"",
      "71/128\"",
      "35/64\"",
      "79/128\""
    ],
    "explanation": "64/128\" + 7/128\" = 71/128\" = 71/128\".",
    "section": 4,
    "answer": 1,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "1/2",
      "vernierIndex": 7
    }
  },
  {
    "id": 45,
    "question": "Escala principal: 5/8\" | nônio: 4ª divisão coincide. Determine a leitura final.",
    "options": [
      "85/128\"",
      "83/128\"",
      "23/32\"",
      "21/32\""
    ],
    "explanation": "80/128\" + 4/128\" = 84/128\" = 21/32\".",
    "section": 4,
    "answer": 3,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "5/8",
      "vernierIndex": 4
    }
  },
  {
    "id": 46,
    "question": "Escala principal: 11/16\" | nônio: 1ª divisão coincide. Determine a leitura final.",
    "options": [
      "89/128\"",
      "45/64\"",
      "11/16\"",
      "97/128\""
    ],
    "explanation": "88/128\" + 1/128\" = 89/128\" = 89/128\".",
    "section": 4,
    "answer": 0,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "11/16",
      "vernierIndex": 1
    }
  },
  {
    "id": 47,
    "question": "Escala principal: 1 1/16\" | nônio: 6ª divisão coincide. Determine a leitura final.",
    "options": [
      "1 15/128\"",
      "1 13/128\"",
      "1 7/64\"",
      "1 11/64\""
    ],
    "explanation": "136/128\" + 6/128\" = 142/128\" = 1 7/64\".",
    "section": 4,
    "answer": 2,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "1 1/16",
      "vernierIndex": 6
    }
  },
  {
    "id": 48,
    "question": "Escala principal: 1 3/8\" | nônio: 5ª divisão coincide. Determine a leitura final.",
    "options": [
      "1 27/64\"",
      "1 13/32\"",
      "1 53/128\"",
      "1 61/128\""
    ],
    "explanation": "176/128\" + 5/128\" = 181/128\" = 1 53/128\".",
    "section": 4,
    "answer": 2,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "1 3/8",
      "vernierIndex": 5
    }
  },
  {
    "id": 49,
    "question": "Escala principal: 2 1/8\" | nônio: 3ª divisão coincide. Determine a leitura final.",
    "options": [
      "2 19/128\"",
      "2 5/32\"",
      "2 9/64\"",
      "2 27/128\""
    ],
    "explanation": "272/128\" + 3/128\" = 275/128\" = 2 19/128\".",
    "section": 4,
    "answer": 0,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "2 1/8",
      "vernierIndex": 3
    }
  },
  {
    "id": 50,
    "question": "Escala principal: 2 3/4\" | nônio: 7ª divisão coincide. Determine a leitura final.",
    "options": [
      "2 13/16\"",
      "2 51/64\"",
      "2 111/128\"",
      "2 103/128\""
    ],
    "explanation": "352/128\" + 7/128\" = 359/128\" = 2 103/128\".",
    "section": 4,
    "answer": 3,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "2 3/4",
      "vernierIndex": 7
    }
  },
  {
    "id": 51,
    "question": "Você precisa medir rapidamente o comprimento de uma estrutura metálica de 4 metros. Qual instrumento deve escolher?",
    "options": [
      "Calibre de solda.",
      "Trena.",
      "Manômetro.",
      "Gabarito de chanfro."
    ],
    "explanation": "A trena é apropriada para comprimentos maiores e distâncias.",
    "section": 5,
    "answer": 1,
    "lesson": "rulers"
  },
  {
    "id": 52,
    "question": "Na montagem, é preciso conferir com precisão o diâmetro interno de um tubo. Qual instrumento usar?",
    "options": [
      "Paquímetro.",
      "Manômetro.",
      "Trena.",
      "Calibre de solda."
    ],
    "explanation": "O paquímetro permite medidas internas com mais precisão.",
    "section": 5,
    "answer": 0,
    "lesson": "internal"
  },
  {
    "id": 53,
    "question": "Antes de unir duas chapas, você quer comparar o ângulo de chanfro com o perfil especificado. Qual recurso é indicado?",
    "options": [
      "Manômetro.",
      "Trena.",
      "Haste de profundidade.",
      "Gabarito."
    ],
    "explanation": "O gabarito é empregado na comparação de ângulos, perfis e formas.",
    "section": 5,
    "answer": 3,
    "lesson": "templates"
  },
  {
    "id": 54,
    "question": "Após executar um cordão, você precisa verificar sua altura de reforço. Qual instrumento utilizar?",
    "options": [
      "Escala graduada.",
      "Manômetro.",
      "Calibre de solda.",
      "Trena."
    ],
    "explanation": "O calibre de solda é projetado para medir altura de coroa e dimensões do cordão.",
    "section": 5,
    "answer": 2,
    "lesson": "weld"
  },
  {
    "id": 55,
    "question": "Durante a soldagem TIG, qual grandeza é acompanhada pelo manômetro?",
    "options": [
      "Abertura da raiz da junta.",
      "Pressão do gás no sistema.",
      "Altura da coroa.",
      "Comprimento da chapa."
    ],
    "explanation": "O manômetro acompanha pressão, não comprimento ou geometria da solda.",
    "section": 5,
    "answer": 1,
    "lesson": "pressure"
  },
  {
    "id": 56,
    "question": "Converta 3/8\" para milímetros.",
    "options": [
      "6,350 mm",
      "12,700 mm",
      "9,525 mm",
      "9,250 mm"
    ],
    "explanation": "(3 ÷ 8) × 25,4 = 9,525 mm.",
    "section": 5,
    "answer": 2,
    "lesson": "conversion"
  },
  {
    "id": 57,
    "question": "Converta 17,4625 mm em polegada fracionária (múltiplos de 1/16\").",
    "options": [
      "11/16\"",
      "9/16\"",
      "5/8\"",
      "13/16\""
    ],
    "explanation": "17,4625 ÷ 25,4 = 0,6875; 0,6875 × 16 = 11; portanto 11/16\".",
    "section": 5,
    "answer": 0,
    "lesson": "conversion"
  },
  {
    "id": 58,
    "question": "Paquímetro métrico (0,05 mm): escala principal = 23 mm; coincide a 13ª divisão do nônio. Qual a leitura?",
    "options": [
      "23,70 mm",
      "23,60 mm",
      "24,15 mm",
      "23,65 mm"
    ],
    "explanation": "23 + (13 × 0,05) = 23 + 0,65 = 23,65 mm.",
    "section": 5,
    "answer": 3,
    "lesson": "metric",
    "reading": {
      "key": "mm-005",
      "main": "23",
      "vernierIndex": 13
    }
  },
  {
    "id": 59,
    "question": "Paquímetro fracionário: escala principal = 1 5/16\"; coincide a 4ª divisão do nônio de 1/128\". Determine a leitura simplificada.",
    "options": [
      "1 45/128\"",
      "1 11/32\"",
      "1 43/128\"",
      "1 13/32\""
    ],
    "explanation": "1 5/16 = 1 40/128; acrescente 4/128 = 1 44/128 = 1 11/32\".",
    "section": 5,
    "answer": 1,
    "lesson": "fraction",
    "reading": {
      "key": "in-128",
      "main": "1 5/16",
      "vernierIndex": 4
    }
  },
  {
    "id": 60,
    "question": "Uma leitura métrica é 12 mm + (10 × 0,05 mm). Compare-a com 1/2\" em milímetros: qual é maior e qual a diferença?",
    "options": [
      "Leitura métrica é maior por 0,20 mm.",
      "1/2\" é maior por 0,20 mm.",
      "São iguais.",
      "1/2\" é maior por 0,50 mm."
    ],
    "explanation": "A leitura é 12,50 mm; 1/2\" = 12,70 mm; diferença = 12,70 − 12,50 = 0,20 mm.",
    "section": 5,
    "answer": 1,
    "lesson": "comparison"
  }
];
  const api=Object.freeze(questions.map(q=>Object.freeze({...q,options:Object.freeze(q.options)})));
  root.MetrologyQuestions=api;
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

