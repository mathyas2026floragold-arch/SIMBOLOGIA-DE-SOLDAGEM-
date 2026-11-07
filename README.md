# Treinamento Visual de Soldagem

[Jogar online](https://mathyas2026floragold-arch.github.io/SIMBOLOGIA-DE-SOLDAGEM-/) · [Código-fonte](https://github.com/mathyas2026floragold-arch/SIMBOLOGIA-DE-SOLDAGEM-)

Plataforma online de treinamento para interpretar simbologia de soldagem, reconhecer juntas e identificar posições em chapas. O aprendizado acontece por desenhos técnicos, comparação visual, ordens de serviço simuladas e correção imediata.

A aplicação é estática e reúne **seis jogos no mesmo menu e no mesmo arquivo HTML**: cinco de soldagem e o novo simulador de paquímetro. Também funciona offline, sem instalação, com progresso salvo no navegador.

## Os seis jogos

| Modo | Atividade |
| --- | --- |
| **MATCH VISUAL** | Relacionar símbolos e soldas executadas, alternando os dois sentidos da comparação. |
| **DETETIVE DO DESENHO** | Investigar os requisitos de uma indicação e reconhecer os elementos do símbolo e as partes do filete. |
| **MONTE O SÍMBOLO** | Interpretar uma descrição técnica e construir a peça e sua indicação de soldagem pelas escolhas de junta, símbolo, medidas e complementos. |
| **FISCAL DE FABRICAÇÃO** | Comparar projeto e execução e identificar a divergência exata quando houver. |
| **DESAFIO 3D DE POSIÇÕES** | Reconhecer posições, orientação, acesso e geometria da união em relação à gravidade. |
| **JOGO 06 — DESAFIO DO PAQUÍMETRO** | Manipular o instrumento, medir uma peça virtual e interpretar a escala, o nônio, o relógio ou o visor do modelo escolhido. |

## Recursos

- **19 famílias de solda**, incluindo filete, chanfros, tampão, ponto, costura, reverso, revestimento e símbolos flangeados de desenhos legados.
- Juntas de topo, T/ângulo, canto, aresta/borda e sobreposta, além das geometrias específicas das famílias adicionais.
- **21 focos de anatomia**: 15 elementos ou posições da indicação e seis partes do filete. Os nomes das respostas aparecem na correção.
- **Oito processos**: GTAW/TIG, GMAW/MIG-MAG, SMAW/eletrodo revestido, FCAW/arame tubular, SAW/arco submerso, PAW/plasma, RSW/ponto por resistência e RSEW/costura por resistência.
- Cauda bifurcada com processo e referência apresentados separadamente, conforme o exercício.
- Posições **1F–4F e 1G–4G**, significados e correspondências ISO/EN; nas verticais, distinção entre avanço ascendente e descendente.
- Ordens de serviço de manutenção com equipamento/TAG, componente, desenho, revisão e requisitos técnicos.
- XP, sequência de acertos, desempenho e **12 níveis**, com prévia do nível máximo que preserva o progresso pessoal.
- Interface responsiva para computador e celular, desenhos originais e reforço do assunto após erros.

## Progressão

Os modos **1, 2, 4 e 5** avançam conforme os acertos em cada jogo. O XP geral não pula as etapas de um modo ainda não praticado.

| Acertos no modo | Etapa |
| --- | --- |
| 0–3 | Primeiras juntas: T e topo, filete e reto, lado da seta, solda contínua e posições 1F/1G. |
| 4–7 | Mais juntas e lados: canto, sobreposta, V, bisel, lado oposto e ambos quando aplicáveis, posições 2F/2G. |
| 8–15 | Medidas e distribuição: comprimento, passo, contorno, campo e cotas aplicáveis. |
| 16–27 | Novas famílias: X, K, U, J, tampão, ponto, costura, acabamento e posições verticais. |
| 28–43 | Leitura avançada: duplos U/J, chanfros flangeados, reverso, revestimento, apoio e posições sobrecabeça. |
| 44 ou mais | Leitura completa: todas as 19 famílias, incluindo símbolos flangeados de desenhos legados. |

No Detetive, as investigações de anatomia entram a cada quarta investigação elegível, a partir de oito acertos no modo. Os focos básicos aparecem primeiro; os demais são liberados com a progressão.

O **jogo 3 começa complexo**, com todas as famílias disponíveis. Seu primeiro caso tem **18 escolhas**: junta de topo em V, S = 8 mm, E = 10 mm, espessura de 10 mm, raiz de 3 mm, face da raiz de 2 mm, ângulo de 60°, lado da seta, distribuição contínua, contorno plano, acabamento G, campo, apoio removível, processo GTAW e referência DET. A. A referência correta só aparece após a conferência.

## Jogo 06 — Desafio do Paquímetro

O novo jogo é aberto pelo cartão **JOGO 06** no menu principal e trabalha exclusivamente com o **paquímetro universal analógico**. Ele abre diretamente no instrumento manipulável da exploração livre. **Praticar leitura** inicia o simulado; se houver uma questão em andamento, **Voltar ao simulado** a recupera. A prática de leitura usa uma única tela: escala principal e nônio ampliados na parte superior; resposta, questão, acertos e erros logo abaixo. A configuração recolhida permite escolher a resolução, a dificuldade, a quantidade de questões e a forma de avaliação.

### Modelo e resoluções

| Modelo simulado | Resoluções disponíveis |
| --- | --- |
| **Universal analógico** | 0,1 mm; 0,05 mm; 0,02 mm; 1/128 pol; 0,001 pol. |

As opções da configuração correspondem ao universal analógico, com escala principal e nônio. O nônio de 0,1 mm é um modelo didático de dez divisões em 9 mm. As escalas métricas têm curso de 150 mm; as imperiais, de 6 pol.

### Movimento e leitura

- Arraste o cursor ou o nônio com o mouse ou por toque na tela. Os elementos móveis do corpo e a ampliação das escalas usam a mesma medida.
- A abertura dos bicos e a extensão da haste de profundidade do universal acompanham o cursor.
- Com a área do instrumento em foco, **← / →** movem uma divisão, **Shift** multiplica o passo por dez e **Home / End** levam aos limites permitidos. A exploração livre usa arraste e teclado; os botões de movimento ficam disponíveis na medição por contato.
- A movimentação dos modos livre e de contato respeita a resolução selecionada e o curso do instrumento. A leitura ampliada mostra a escala principal e o nônio contínuos, encostados na mesma borda do instrumento. O zoom e a rolagem acontecem nessa mesma área, inclusive no celular.
- **Tela cheia** amplia o jogo completo, incluindo a bancada e a resposta. Use **Sair da tela cheia** ou **Escape** para retornar. Nos navegadores que não oferecem a API de tela cheia, a bancada ocupa a área disponível da página. A sessão continua na mesma posição.
- Na prática de leitura e na medição por contato, a ampliação pode ser selecionada em **100%, 200%, 400% ou 800%**. Na vista principal do jogo métrico, os números grandes indicam centímetros e cada intervalo pequeno vale um milímetro, como no instrumento.
- A leitura numérica abaixo do instrumento mostra a medida em tempo real. No modo livre, o botão com olho permite **ocultar ou revelar a medida**; ao ocultar, a explicação numérica também é escondida.

### Leitura, modo livre e medição por contato

**Prática de leitura:** o jogo posiciona o paquímetro numa medida aleatória. Interprete a escala e digite a resposta. O cursor permanece na posição sorteada até a confirmação; não é preciso obter contato com uma peça nesse treino. Os acertos e erros são contados na própria linha de resposta. Ao concluir uma sessão com respostas, escolha **Praticar novamente** ou **Encerrar**. Encerrar uma sessão sem respostas devolve o instrumento diretamente, sem resultado de 0%.

**Modo livre:** entre pelo botão **Modo livre** no cabeçalho. O jogo abre em tela cheia, com o instrumento inteiro em traço técnico, bicos chanfrados, guias do cursor, parafusos e rolete de ajuste. Arraste o cursor para abrir e fechar os bicos; a cota entre as faces e o visor grande acompanham a medida. O olho esconde os valores. **Ampliar nônio** aproxima a região móvel do próprio instrumento, com enquadramento fixo e proporcional que acompanha o cursor. A lupa mantém visíveis a escala principal, o zero, os traços e os números do nônio; **Ver instrumento** devolve a vista completa na mesma área. Também há ajuste por teclado e posicionamento por valor digitado.

A primeira exploração começa em **56,10 mm** (ou **2,25 pol** na escala imperial). A posição e a escolha de ocultar a leitura ficam salvas. **Voltar ao simulado** recupera a questão, a resposta digitada e a pontuação; o tempo de treinamento pausa durante a exploração, enquanto o cronômetro de uma prova continua. A atividade livre não acrescenta respostas nem pontos.

**Medição por contato:** o sistema gera uma peça virtual de dimensão fixa. Movimente os bicos externos do universal até encostar no material e faça a leitura. O limite de contato impede atravessar a peça; movimentar o cursor não muda a dimensão que deve ser medida. O instrumento e a escala ampliada são alternados na mesma área de desenho.

Na medição por contato, digite a medida depois de obter o contato. O campo aceita vírgula ou ponto decimal; na escala de 1/128 pol também aceita frações, frações mistas e suas equivalências decimais.

Escolha entre dificuldade **fácil** (medidas inteiras), **média** (casas decimais progressivas) e **difícil** (resolução completa). As sessões podem ter **10, 20 ou 30 questões**, ou continuar **sem limite** até a conclusão pelo jogador.

### Treinamento, prova e progresso

**Treinamento** oferece dicas e correção após cada resposta, com a medida correta e o cálculo correspondente. **Prova** usa cronômetro, não oferece dicas e apresenta os resultados somente ao terminar. A leitura numérica permanece oculta entre as questões da prova.

O desempenho inclui pontos, acertos, erros, aproveitamento, sequência, tempo de resposta, recorde e histórico das últimas medições. O paquímetro mantém seu próprio progresso no LocalStorage, separado do histórico dos jogos de soldagem.

| Acertos acumulados no paquímetro | Nível |
| --- | --- |
| 0–3 | Conhecendo o paquímetro. |
| 4–9 | Leitura da escala principal. |
| 10–17 | Leitura do nônio. |
| 18–29 | Medidas com casas decimais. |
| 30–44 | Leitura avançada. |
| 45 ou mais | Desafio profissional. |

### Escalas e referências do simulador

Os nônios métricos têm 10 divisões em 9 mm, 20 em 39 mm (nônio expandido) ou 50 em 49 mm. Em 1/128 pol, a escala principal usa 1/16 pol e oito divisões do nônio ocupam 7/16 pol. Na escala imperial decimal, cada divisão principal vale 0,025 pol e as 25 divisões do nônio têm passo de 0,024 pol.

O desenho vetorial e o código do instrumento são originais. O formato da prática de leitura tem como referência a [autoavaliação de paquímetro do Prof. Eduardo J. Stefanelli](https://www.stefanelli.eng.br/paquimetro-milimetro-05-autoavaliacao/), indicada pelo usuário. No nônio expandido de 0,05 mm, os números de 0 a 10 aparecem a cada dois traços; cada divisão vale 0,05 mm.

O motor, o visor e o desenho compartilham a definição de cada escala. As medidas e as coincidências são calculadas em divisões inteiras da resolução; o desenho usa proporções dessas mesmas divisões. Respostas decimais e fracionárias são comparadas por razões exatas com `BigInt`, sem tolerância para aceitar valores diferentes. O arredondamento de posicionamento escolhe a divisão mais próxima e, no ponto médio, a superior; ele não transforma uma resposta fora da resolução em acerto.

Para uma divisão principal `C`, passo do nônio `p` e múltiplo `K`, a resolução é `R = K × C − p`. A leitura é `M + i × R`, com `M` igual à última divisão principal completa antes do zero e `i` igual ao índice do traço alinhado. No desenho, esse traço está em `M + i × R + i × p = M + i × K × C`, exatamente numa graduação principal.

| Resolução | Divisão principal C | Passo do nônio p | Divisões | K |
| --- | --- | --- | --- | --- |
| 0,1 mm | 1 mm | 0,9 mm | 10 | 1 |
| 0,05 mm expandido | 1 mm | 1,95 mm | 20 | 2 |
| 0,02 mm | 1 mm | 0,98 mm | 50 | 1 |
| 1/128 pol | 1/16 pol | 7/128 pol | 8 | 1 |
| 0,001 pol | 0,025 pol | 0,024 pol | 25 | 1 |

Os modelos métricos e exemplos de leitura foram conferidos nas figuras 3 e 4 do material [Mitutoyo — Vernier Graduations](https://www.mitutoyo.com/webfoo/wp-content/uploads/E12029-Calipers.pdf). O [guia rápido da Mitutoyo](https://www2.mitutoyo.co.jp/eng/useful/E11003/pageindices/index22.html) explica o nônio longo de 0,05 mm. A suíte inclui os exemplos publicados de 11,4 mm, 30,35 mm, 15,42 mm e 16,15 mm.

As referências incluem [Mitutoyo — leitura de paquímetros e variantes de escala](https://www.mitutoyo.com/metrology-insights/mitutoyo-calipers-digital-dial-and-vernier-calipers-precision-measurement-tools-for-manufacturing/). A equivalência de unidades segue o [NIST — fatores de conversão](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b8). Resolução indica o valor da divisão do modelo; não é uma garantia de exatidão de um instrumento real.

## Executar

Abra **`index.html`** ou **`SIMBOLOGIA DE SOLDAGEM.html`** no navegador. Os dois arquivos contêm o mesmo jogo completo; a pasta `work` é usada no desenvolvimento.

Para uma prévia por servidor local, com Node.js instalado, execute na raiz do projeto:

```sh
node work/preview-server.cjs
```

A prévia fica disponível em `http://127.0.0.1:8743/`. O arquivo HTML também pode ser servido por uma hospedagem estática.

O progresso pertence ao navegador e à origem em que o jogo foi aberto. Abrir por arquivo local e abrir por um endereço de servidor podem usar históricos de progresso diferentes.

## Construir

Os módulos de desenvolvimento estão em `work`. Para reconstruir o HTML a partir das fontes e da base incluída nessa pasta:

```sh
node work/build-five-modes.cjs
```

O comando atualiza `SIMBOLOGIA DE SOLDAGEM.html` e `index.html` na raiz. A execução do jogo não exige Node.js nem dependências externas.

## GitHub Pages

A publicação está configurada para usar a branch **main** e a pasta **/ (root)**. O arquivo `index.html` é a página de entrada. Novos envios para essa branch iniciam a atualização do site pelo GitHub Pages.

Consulte a [documentação oficial do GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) para os detalhes da publicação.

## Verificar

Execute as onze verificações na raiz do projeto:

```sh
node work/check-levels-v3.cjs
node work/check-special-weld-gameplay.cjs
node work/check-five-modes.cjs
node work/check-builder-workspace.cjs
node work/check-progression.cjs
node work/check-technical-builder.cjs
node work/check-process-anatomy.cjs
node work/check-caliper-engine.cjs
node work/check-caliper-instrument.cjs
node work/check-caliper-ui.cjs
node work/check-caliper-precision.cjs
```

Elas cobrem níveis, progresso salvo, prévia do máximo, integração dos cinco modos de soldagem, respostas únicas, reforço, montagem e correção por campo, progressão, parâmetros técnicos, processos e anatomia. As verificações do paquímetro acrescentam quantização e limites, leitura métrica e imperial, formatos de resposta, sincronização entre cursor e elementos de medição, alvo fixo, alinhamento real das escalas SVG, ocultação da leitura e ponteiros do relógio.

## Convenções de estudo

Nos jogos de soldagem, o material adota a convenção AWS de linha de referência única: abaixo corresponde ao lado da seta; acima, ao lado oposto. As dimensões são em milímetros e os desenhos são esquemáticos, sem escala. Símbolos flangeados de desenhos legados são identificados no treinamento.

Referências técnicas incluem o [guia de símbolos da Miller](https://www.millerwelds.com/en-us/resources/knowledge-hub/welding-basics/how-to-read-and-understand-weld-symbols) e os materiais [Design — Part 1](https://www.twi-global.com/technical-knowledge/job-knowledge/design-part-1-090) e [Design — Part 2](https://www.twi-global.com/technical-knowledge/job-knowledge/design-part-2-091), da TWI. Para fabricação, prevalecem a norma e o desenho aplicáveis.
