# Elovia — Home comercial atualizada

Esta versão mantém o MESMO projeto e servidor. A página `/` foi substituída pela nova direção visual aprovada: azul-marinho, dourado, apresentação comercial e categorias do catálogo expandido.

## Arquivos da Home
- `home.js`: conteúdo e estrutura da página inicial.
- `public/home.css`: design system e regras de responsividade.
- `public/home.js`: menu móvel.
- `public/assets/`: imagens das prévias.

## Navegação
- `/`: vitrine comercial da Elovia.
- `/montar`: primeira etapa efetiva de personalização/orçamento; a Home não realiza cadastro nem compra.
- `/acompanhar`: acompanhamento de pedido.
- `/igreja/entrar`: acesso à igreja.
- `/admin`: painel interno.

## Importante sobre o catálogo
A Home apresenta as 10 categorias definidas no documento de funcionalidades. Isso não ativa automaticamente todos os módulos: o sistema continua aceitando pedidos apenas dos módulos já implementados. Não anuncie módulos novos como operacionais antes de desenvolvê-los, testá-los e habilitá-los no catálogo do backend.

## Validação
`npm test`: 3 testes passaram (fluxo comercial, Home, isolamento entre igrejas).
`GET /`: respondeu HTTP 200 na verificação local.
Não foi possível concluir captura de tela no Chromium deste ambiente; revise o layout visualmente no seu navegador desktop e celular.

## Execução
No PowerShell, dentro da pasta `elovia-produto`:

```powershell
$env:ADMIN_USER="admin"
$env:ADMIN_PASSWORD="EscolhaUmaSenhaForteUnicaComMaisDe20Caracteres!"
npm start
```

Abra http://localhost:3000 . Requer Node.js >= 22.13.

A instalação continua local e sem pagamento automático. Não é uma declaração de prontidão em produção.
