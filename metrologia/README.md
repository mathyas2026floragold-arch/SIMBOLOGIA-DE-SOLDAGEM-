# METROLOGIA PRO — O DESAFIO DA PRECISÃO

Treinamento interativo de conversão de unidades e leitura de instrumentos, com desenhos de escalas, correção explicada e progressão por habilidade.

**[Abrir o Metrologia Pro online](https://mathyas2026floragold-arch.github.io/SIMBOLOGIA-DE-SOLDAGEM-/metrologia/)**

## Três trilhas

| Trilha | Prática |
| --- | --- |
| **Polegada → milímetro** | Converter polegadas decimais e fracionárias para milímetros, usando o fator exato de 25,4 mm por polegada. |
| **Milímetro → polegada** | Responder em decimal ou fração, com a precisão e o arredondamento informados no enunciado. |
| **Leitura de instrumentos** | Ler réguas métricas e em polegadas e somar escala principal e nônio do paquímetro. |

O treino completo intercala as três trilhas. Também é possível praticar uma trilha por missão.

## Instrumentos

- **Régua métrica:** divisões de 1 mm ou 0,5 mm, com vista completa e ampliação da extremidade.
- **Régua em polegadas:** divisões de 1/16 ou 1/32 de polegada.
- **Paquímetro com nônio métrico:** resoluções de 0,1 mm, 0,05 mm ou 0,02 mm. Os modelos representam, respectivamente, 10 divisões em 9 mm, 20 em 19 mm e 50 em 49 mm.

Os desenhos são escalas didáticas ampliadas. Nos nônios mais longos, janelas consecutivas preservam a relação entre as duas escalas. A área permite rolagem e zoom para examinar os traços no computador ou no celular. A resposta e os alinhamentos destacados aparecem após a conferência.

## Progressão e pontuação

Cada trilha tem seis etapas, liberadas pelos acertos nessa própria habilidade:

| Acertos acumulados na trilha | Etapa |
| --- | --- |
| 0–3 | Primeiras medidas |
| 4–8 | Divisões e metades |
| 9–15 | Leitura técnica |
| 16–24 | Precisão em prática |
| 25–35 | Frações finas |
| 36 ou mais | Domínio metrológico |

As missões têm **oito questões**. Um acerto sem dica vale **20 XP**, com bônus de sequência que cresce de 2 em 2 até **8 XP adicionais**. Ao usar a dica, o acerto vale **10 XP**. Erros mostram o raciocínio e retomam a habilidade com outra medida.

O XP também alimenta oito níveis de carreira: Aprendiz, Auxiliar de medição, Técnico em formação, Inspetor, Especialista, Analista de precisão, Mestre da medida e Referência técnica. O nível geral de carreira não substitui a progressão separada das trilhas.

## Respostas, frações e arredondamento

- Escolha uma alternativa ou digite a medida sem a unidade.
- Nas respostas decimais, use vírgula ou ponto: `9,525` e `9.525` representam o mesmo valor.
- Nas respostas fracionárias, use uma fração, fração mista ou inteiro: `3/8`, `1 1/4` ou `2`. Frações equivalentes são reconhecidas; pratique a forma simplificada solicitada.
- O formato pedido importa: uma questão fracionária exige fração ou inteiro; uma questão decimal exige decimal ou inteiro.
- O enunciado distingue resultado exato de aproximação e informa as casas decimais ou o múltiplo fracionário mais próximo. Arredonde somente ao final.

O **Guia de bolso** reúne exemplos, divisões de polegada, leitura das escalas e uma calculadora de conversão sem pontuação. A **Bancada livre**, também sem pontuação, permite mover uma medida na régua métrica ou no paquímetro e acompanhar a leitura explicada.

## Progresso local

XP, acertos, conquistas, preferências e missão em andamento são salvos neste navegador, de forma independente do treinamento de soldagem. Dispositivos, navegadores e endereços diferentes mantêm históricos próprios. Quando o armazenamento local estiver indisponível, a interface informa que o progresso durará somente enquanto a página estiver aberta.

## Executar e verificar

A aplicação usa arquivos estáticos: `index.html`, `styles.css`, `engine.js`, `instruments.js` e `app.js`. Para abrir localmente, mantenha esses arquivos juntos e abra `index.html` no navegador. Não há etapa de compilação nem instalação de dependências.

Para usar o servidor de prévia, execute na raiz do repositório, com Node.js instalado:

```sh
node metrologia/preview.cjs
```

Abra a [prévia local na porta 8745](http://127.0.0.1:8745/).

Para verificar o motor e as escalas:

```sh
node metrologia/check-engine.cjs
```

A verificação cobre conversões, arredondamentos, formatos de resposta, seis etapas, frações, alternativas únicas e alinhamento matemático das escalas, incluindo a visibilidade do milímetro completo antes do zero do nônio.

## Referências

- [NIST — unidades de comprimento e definição da polegada internacional](https://www.nist.gov/pml/owm/si-units-length).
- [Mitutoyo — leitura da escala principal e do nônio](https://www2.mitutoyo.co.jp/eng/support/service/catalog/08/E11003.pdf).
- [Mitutoyo — paquímetros e resolução de 0,02 mm](https://www2.mitutoyo.co.jp/eng/products/nogisu/hyojyun.html).

Resolução descreve a menor divisão do modelo apresentado; ela não determina, sozinha, a exatidão de um instrumento real.
