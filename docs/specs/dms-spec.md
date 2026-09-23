# Especificação - Document Management System

## 1. Objetivo

Entregar uma aplicação web para enviar, listar e baixar documentos, mantendo os arquivos no filesystem local e os metadados em memória, com uma separação simples de responsabilidades entre API, regras de negócio, persistência e interface React.

## 2. Escopo

### 2.1 Dentro do escopo

- Upload de um documento por requisição HTTP multipart.
- Armazenamento do conteúdo no filesystem local da aplicação.
- Registro dos metadados do documento em memória.
- Listagem dos documentos registrados.
- Download do conteúdo pelo identificador do documento.
- Registro de um identificador de proprietário (`owner`) nos metadados.
- Interface React para upload, listagem e download.
- Tratamento consistente de entradas inválidas, documentos inexistentes e falhas de leitura ou escrita.
- Endpoint de saúde para verificar se a API está disponível.

### 2.2 Fora do escopo

- Armazenamento externo, em nuvem, banco de dados ou serviço de upload de terceiros.
- Versionamento, histórico ou restauração de documentos.
- Edição, conversão, visualização ou processamento do conteúdo dos arquivos.
- Autenticação, autorização e gestão completa de contas de usuários.
- Compartilhamento entre usuários ou permissões granulares.
- Busca textual, categorização, tags e pastas.
- Exclusão de documentos, enquanto não houver requisito específico para esse fluxo.

### 2.3 Limitações conhecidas

- Os metadados são mantidos somente em memória e podem ser perdidos quando o processo é reiniciado.
- Os arquivos físicos podem permanecer em `backend/storage` após a perda dos metadados; a implementação deve evitar expor arquivos sem registro correspondente.
- O campo `owner` é um metadado de domínio nesta fase e não representa uma fronteira de segurança enquanto não existir autenticação.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um documento por meio de uma requisição `multipart/form-data`. |
| RF-02 | A requisição de upload deve conter um arquivo no campo `file`. |
| RF-03 | O sistema deve rejeitar requisições sem arquivo com resposta `400`. |
| RF-04 | O sistema deve validar tamanho e tipo do arquivo conforme configuração da aplicação. |
| RF-05 | O sistema deve gerar um identificador único para cada documento aceito. |
| RF-06 | O sistema deve salvar o conteúdo em `backend/storage` utilizando `multer` com `diskStorage`. |
| RF-07 | O sistema deve registrar os metadados `id`, `originalName`, `size`, `uploadedAt` e `owner`. |
| RF-08 | O sistema deve retornar os metadados do documento criado após um upload bem-sucedido. |
| RF-09 | O sistema deve listar os documentos registrados em memória. |
| RF-10 | A listagem deve retornar metadados, sem incluir o conteúdo binário dos arquivos. |
| RF-11 | O sistema deve localizar um documento pelo identificador informado na URL. |
| RF-12 | O sistema deve retornar o conteúdo binário do documento localizado para download. |
| RF-13 | O download deve preservar um nome de arquivo adequado ao `originalName`, sem usar o nome enviado para determinar o caminho físico. |
| RF-14 | O sistema deve retornar `404` quando o identificador não existir ou não tiver metadado correspondente. |
| RF-15 | O sistema deve retornar `404` quando o metadado existir, mas o arquivo físico não puder ser localizado. |
| RF-16 | O sistema deve manter o endpoint `GET /health`, retornando o estado básico da API. |
| RF-17 | O frontend deve permitir selecionar um arquivo, enviar o upload, atualizar a listagem e iniciar o download. |
| RF-18 | O frontend deve exibir estados de carregamento, sucesso e erro para as operações de API. |
| RF-19 | O sistema deve tratar falhas de filesystem e erros inesperados sem expor stack traces ao cliente. |
| RF-20 | O sistema deve permitir a evolução futura do `owner` para uma identidade autenticada sem acoplar a regra de negócio a um provedor externo. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | O backend deve usar Node.js, Express e CommonJS. |
| RNF-02 | O frontend deve usar React, Vite, ESM e componentes funcionais com React Hooks. |
| RNF-03 | A API deve separar `routes`, `controllers`, `services` e `repositories` conforme a Clean Architecture simples definida neste documento. |
| RNF-04 | O fluxo de dependência deve ser `routes -> controllers -> services -> repositories`. |
| RNF-05 | Os arquivos devem ser persistidos exclusivamente no filesystem local, em `backend/storage`. |
| RNF-06 | O upload deve usar `multer` configurado com `diskStorage`; não devem ser usados provedores externos ou serviços de terceiros. |
| RNF-07 | Os metadados devem permanecer em memória nesta primeira versão. |
| RNF-08 | O caminho físico do arquivo deve ser gerado pelo servidor, sem confiar no nome enviado pelo cliente. |
| RNF-09 | Limite de tamanho, diretório de armazenamento, porta e demais configurações operacionais devem ser obtidos por variáveis de ambiente, com valores padrão documentados. |
| RNF-10 | O sistema deve usar nomes descritivos em inglês para símbolos de código e mensagens de usuário em português. |
| RNF-11 | O sistema deve tratar erros nas fronteiras HTTP e de filesystem, mantendo respostas previsíveis. |
| RNF-12 | A implementação deve evitar dependências novas quando as dependências já presentes forem suficientes. |
| RNF-13 | A API deve ser testável com o runner nativo do Node (`node:test`). |
| RNF-14 | O frontend deve consumir a API por `fetch` usando o prefixo `/api`, conforme o proxy do Vite. |
| RNF-15 | A implementação deve preservar o endpoint existente `/health` e não quebrar funcionalidades existentes. |

### 4.1 Configuração mínima sugerida

| Variável | Finalidade | Valor padrão sugerido |
| --- | --- | --- |
| `PORT` | Porta do backend | `3000` |
| `STORAGE_DIR` | Diretório dos arquivos enviados | `backend/storage` |
| `MAX_FILE_SIZE_BYTES` | Limite máximo por arquivo | `10485760` (10 MiB) |
| `ALLOWED_MIME_TYPES` | Tipos MIME permitidos | Configuração definida pelo ambiente |
| `DEFAULT_OWNER` | Identidade provisória quando não houver contexto autenticado | `anonymous` |

Os valores padrão podem ser ajustados durante a implementação, mas não devem ser codificados em múltiplos módulos. A ausência de autenticação não deve ser apresentada como controle de acesso.

## 5. Modelo de dados

### 5.1 Metadados do documento

| Campo | Tipo | Obrigatório | Descrição e invariantes |
| --- | --- | --- | --- |
| `id` | `string` | Sim | Identificador único gerado pelo servidor. Não deve ser derivado diretamente do nome do arquivo. |
| `originalName` | `string` | Sim | Nome original informado pelo cliente, preservado apenas como metadado e para o nome sugerido no download. |
| `size` | `number` | Sim | Tamanho do conteúdo em bytes; deve ser inteiro maior ou igual a zero. |
| `uploadedAt` | `string` | Sim | Data e hora de criação em formato ISO 8601 UTC. |
| `owner` | `string` | Sim | Identificador lógico do proprietário. Nesta fase pode ser `anonymous` ou vir de um contexto de requisição preparado para futura autenticação. |
| `storageName` | `string` | Sim, interno | Nome físico seguro gerado pelo servidor. Não deve ser exposto como caminho arbitrário ao cliente. |
| `storagePath` | `string` | Sim, interno | Caminho controlado pelo repositório dentro de `STORAGE_DIR`. Nunca deve ser montado diretamente a partir de entrada do cliente. |

O contrato público de listagem e upload deve retornar os campos funcionais (`id`, `originalName`, `size`, `uploadedAt` e `owner`). `storageName` e `storagePath` são detalhes de persistência e não devem ser usados pelo frontend.

### 5.2 Estrutura de persistência

- O repositório deve manter os metadados em uma estrutura em memória, preferencialmente um `Map` indexado por `id`.
- O conteúdo binário deve ser escrito pelo `multer.diskStorage` em `STORAGE_DIR`.
- O nome original não pode ser utilizado sem sanitização para definir o caminho físico.
- O registro de metadados deve ocorrer somente após o upload físico ser aceito.
- Se o registro em memória falhar depois da gravação física, o fluxo deve tentar remover o arquivo órfão e retornar erro interno.
- Após reinicialização do processo, os metadados podem desaparecer; não é responsabilidade desta versão reconstruí-los automaticamente.

## 6. Contratos de API

### 6.1 Convenção geral

- A API backend expõe as rotas sem prefixo quando executada diretamente, por exemplo `POST /upload`.
- O frontend acessa as mesmas rotas através de `/api`, usando o proxy do Vite. Assim, a chamada do frontend será `POST /api/upload` e o proxy encaminhará para `POST /upload`.
- Respostas JSON devem usar `Content-Type: application/json; charset=utf-8`.
- Erros devem seguir o formato:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem legível para o usuário"
  }
}
```

- Mensagens podem ser exibidas ao usuário, mas códigos são a referência estável para o frontend.

### 6.2 GET /health

Verifica se a aplicação está disponível.

**Resposta de sucesso: `200 OK`**

```json
{
  "status": "ok"
}
```

### 6.3 POST /upload

Cria um documento.

**Entrada**

- `Content-Type: multipart/form-data; boundary=...`
- Campo obrigatório: `file`.
- O cliente não deve enviar o caminho físico do arquivo.
- O proprietário pode ser obtido de um contexto de identidade futuro; sem autenticação, usar `DEFAULT_OWNER`.

**Resposta de sucesso: `201 Created`**

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 24576,
  "uploadedAt": "2026-09-23T12:00:00.000Z",
  "owner": "anonymous"
}
```

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `FILE_REQUIRED` | Nenhum arquivo foi enviado ou o campo não é `file`. |
| `400` | `FILE_TYPE_NOT_ALLOWED` | O tipo MIME não está configurado como permitido. |
| `413` | `FILE_TOO_LARGE` | O arquivo excede `MAX_FILE_SIZE_BYTES`. |
| `500` | `STORAGE_ERROR` | Falha ao criar ou gravar o arquivo local. |
| `500` | `METADATA_ERROR` | Falha ao registrar os metadados em memória. |

### 6.4 GET /documents

Lista os documentos registrados em memória.

**Resposta de sucesso: `200 OK`**

```json
{
  "documents": [
    {
      "id": "document-id",
      "originalName": "relatorio.pdf",
      "size": 24576,
      "uploadedAt": "2026-09-23T12:00:00.000Z",
      "owner": "anonymous"
    }
  ]
}
```

A resposta deve ser uma lista vazia quando não houver documentos. A ordenação recomendada é por `uploadedAt` decrescente, para exibir os documentos mais recentes primeiro.

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `500` | `METADATA_READ_ERROR` | Falha ao consultar a estrutura de metadados. |

### 6.5 GET /documents/:id/download

Retorna o conteúdo binário de um documento.

**Entrada**

- Parâmetro de rota obrigatório: `id`.
- O identificador deve ser validado antes da consulta ao filesystem.

**Resposta de sucesso: `200 OK`**

- Corpo: bytes do arquivo.
- `Content-Type`: tipo MIME registrado ou detectado de forma segura.
- `Content-Disposition`: `attachment; filename="nome-original"`, com o nome devidamente codificado para evitar cabeçalhos inválidos.
- O caminho lido deve ser obtido exclusivamente dos metadados do repositório, nunca diretamente do parâmetro da URL.

**Erros previstos**

| Status | Código | Situação |
| --- | --- | --- |
| `400` | `INVALID_DOCUMENT_ID` | Identificador ausente ou inválido. |
| `404` | `DOCUMENT_NOT_FOUND` | Não há metadado para o identificador informado. |
| `404` | `FILE_NOT_FOUND` | Há metadado, mas o arquivo físico não está disponível. |
| `500` | `DOWNLOAD_ERROR` | Falha inesperada ao ler ou transmitir o arquivo. |

## 7. Decisões arquiteturais

### 7.1 Backend

O backend deve seguir uma Clean Architecture simples, sem abstrações além das necessárias:

```text
routes -> controllers -> services -> repositories
```

- `routes/`: registra métodos HTTP, paths, middleware de upload e delegação aos controllers. Não contém regras de negócio.
- `controllers/`: interpreta parâmetros, arquivos e headers HTTP; chama os serviços; converte resultados e erros para respostas HTTP.
- `services/`: aplica regras de negócio, valida invariantes, coordena upload, criação de metadados, listagem e download. Não deve depender de objetos específicos do Express.
- `repositories/`: encapsula o `Map` de metadados e o acesso ao filesystem local. Deve fornecer operações pequenas, como salvar metadados, listar, buscar por ID e obter o caminho físico controlado.
- `app.js`: configura o Express, middleware comum, rotas e tratamento final de erros; deve continuar exportando a aplicação para testes.

As camadas internas não devem conhecer detalhes das camadas externas. O serviço não deve receber diretamente o objeto `req` ou `res`, e o repositório não deve construir respostas HTTP.

### 7.2 Upload e filesystem

- Usar `multer` com `diskStorage` configurado para `STORAGE_DIR`.
- Gerar o nome físico com um identificador seguro do servidor.
- Criar o diretório de armazenamento quando necessário, sem mover a responsabilidade para o frontend.
- Manter o `originalName` separado do nome físico.
- Não aceitar caminhos fornecidos pelo cliente.
- Não usar S3, banco de dados, APIs externas ou serviços de terceiros.

### 7.3 Frontend

O frontend deve usar React com componentes funcionais e organizar responsabilidades em:

- `components/UploadComponent`: seleção do arquivo, submissão de `FormData` e estados da operação.
- `components/DocumentList`: carregamento e renderização dos metadados.
- `components/DownloadButton`: construção da URL de download e acionamento do navegador.
- `services/`: funções `fetch` para encapsular as chamadas à API usando o prefixo `/api`.
- `pages/` e `App.jsx`: composição da tela e coordenação do fluxo, sem acessar o filesystem ou duplicar regras de negócio.

Mensagens de erro e estados de carregamento devem ser apresentados em português. O frontend não deve presumir que o conteúdo binário esteja disponível na resposta de listagem.

### 7.4 Erros e observabilidade

- Erros de entrada devem ser diferenciados de falhas internas.
- O cliente não deve receber stack trace, caminho absoluto ou detalhes sensíveis do filesystem.
- O backend pode registrar detalhes técnicos no console durante esta fase inicial, sem criar uma camada de logging própria.
- O tratamento de erros deve ser centralizado o suficiente para manter o formato das respostas consistente.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura. A criação desta especificação não executa nenhuma delas.

### Etapa 1 - Consolidar contrato e configuração

- Revisar este documento e transformar as decisões em constantes/configuração centralizada.
- Preservar o endpoint `/health` e a exportação da aplicação.
- Definir variáveis de ambiente, valores padrão e mensagens de erro.
- Critério de aceite: contrato de API e configuração documentados, sem dependência externa.
- Verificação: `npm test` no backend e chamada manual a `GET /health`.

### Etapa 2 - Implementar o repositório local

- Criar o repositório de metadados em memória.
- Configurar `multer.diskStorage` com `STORAGE_DIR`.
- Implementar geração de nome físico seguro e operações de salvar, listar e buscar.
- Tratar arquivos órfãos em falhas de registro.
- Critério de aceite: arquivos são gravados apenas em `backend/storage` e metadados não vazam detalhes internos.
- Verificação: testes unitários ou de integração para persistência, caminhos e reinicialização conhecida.

### Etapa 3 - Implementar serviços de domínio

- Implementar upload, listagem e download sem dependência de Express.
- Aplicar validação de tamanho, MIME, identificador e proprietário.
- Definir erros de domínio mapeáveis para os códigos HTTP.
- Critério de aceite: regras de negócio podem ser testadas com repositórios substituíveis.
- Verificação: testes com arquivo válido, arquivo inválido, ID inexistente e arquivo físico ausente.

### Etapa 4 - Implementar controllers e routes

- Criar controllers para os endpoints previstos.
- Registrar rotas e middleware de upload.
- Adicionar tratamento centralizado de erros no Express.
- Critério de aceite: todos os contratos HTTP desta especificação são atendidos.
- Verificação: testes com `node:test` cobrindo status, headers, JSON e conteúdo binário.

### Etapa 5 - Ampliar os testes do backend

- Preservar e ampliar o teste existente em `backend/test/app.test.js`.
- Cobrir sucesso e falhas de cada endpoint.
- Confirmar que o caminho do download não permite traversal e que nomes enviados não controlam o caminho físico.
- Critério de aceite: os fluxos principais e os riscos de armazenamento local possuem cobertura automatizada.
- Verificação: `npm test` dentro de `backend`.

### Etapa 6 - Implementar o frontend

- Criar os componentes de upload, listagem e download.
- Criar o serviço `fetch` com prefixo `/api` e tratamento de erros.
- Integrar os estados de carregamento, sucesso e falha.
- Critério de aceite: o usuário consegue enviar, visualizar e baixar documentos pelo navegador.
- Verificação: `npm run build` dentro de `frontend` e teste manual com o proxy do Vite.

### Etapa 7 - Integrar e validar o fluxo completo

- Iniciar backend e frontend em conjunto.
- Validar upload, listagem, download e mensagens de erro pelo navegador e por `curl`.
- Confirmar que o proxy `/api` encaminha para o backend sem alterar os contratos.
- Critério de aceite: fluxo completo funcional sem armazenamento externo.
- Verificação: `npm test`, `npm run build` e smoke test manual dos endpoints.

### Etapa 8 - Revisão e endurecimento

- Revisar limites de upload, tipos MIME, tratamento de nomes, ownership e exposição de erros.
- Revisar documentação e variáveis de ambiente.
- Adicionar CI para testes do backend e build do frontend, quando solicitado pelo projeto.
- Critério de aceite: mudanças permanecem compatíveis com SOLID, DRY, KISS, YAGNI e 12-Factor.
- Verificação: execução limpa dos comandos de teste/build e revisão do diff.

## 9. Critérios de aceite gerais

- O documento e a implementação futura mantêm o fluxo `routes -> controllers -> services -> repositories`.
- O upload usa obrigatoriamente `multer.diskStorage` e grava em `backend/storage`.
- Nenhum provedor externo é utilizado.
- Os metadados possuem `id`, `originalName`, `size`, `uploadedAt` e `owner`.
- Os endpoints de upload, listagem, download e saúde têm contratos previsíveis para sucesso e erro.
- O frontend utiliza `fetch` com o prefixo `/api` e componentes React funcionais.
- A perda de metadados após reinicialização é conhecida e documentada.
- A especificação não exige a execução ou criação de arquivos de backend e frontend como parte desta etapa.
