let items = [];

        // Atualiza campos de texto simples
        function updateField(fieldKey) {
            const val = document.getElementById(`in-${fieldKey}`).value;
            const outElement = document.getElementById(`out-${fieldKey}`);
            if (outElement) {
                outElement.innerText = val || (fieldKey === 'emp-nome' ? 'Nome da Empresa' : '-');
            }

            // Regras especiais para replicar os nomes nas assinaturas
            if (fieldKey === 'cliente-nome') {
                document.getElementById('out-cliente-assinatura').innerText = val || 'Cliente';
            }
            if (fieldKey === 'emp-nome') {
                document.getElementById('out-emp-assinatura').innerText = val || 'Empresa';
            }
        }

        // Formatação de Moeda
        function formatMoney(value) {
            return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        // Adiciona nova linha de item no formulário
        function addItem() {
            const id = Date.now();
            items.push({ id, desc: '', qtd: 1, val: 0.00 });
            renderFormItems();
            renderPreviewItems();
        }

        // Remove linha
        function removeItem(id) {
            items = items.filter(i => i.id !== id);
            renderFormItems();
            renderPreviewItems();
        }

        // Atualiza dados do array quando edita o form
        function updateItemData(id, field, value) {
            const item = items.find(i => i.id === id);
            if (item) {
                item[field] = field === 'desc' ? value : parseFloat(value) || 0;
                renderPreviewItems();
            }
        }

        // Renderiza os inputs na lateral esquerda
        function renderFormItems() {
            const container = document.getElementById('items-container');
            container.innerHTML = '';
            items.forEach((item, index) => {
                container.innerHTML += `
                    <div class="item-row">
                        <input type="text" placeholder="Descrição" class="flex-3" value="${item.desc}" onkeyup="updateItemData(${item.id}, 'desc', this.value)">
                        <input type="number" placeholder="Qtd" class="flex-1" value="${item.qtd}" onkeyup="updateItemData(${item.id}, 'qtd', this.value)" onchange="updateItemData(${item.id}, 'qtd', this.value)">
                        <input type="number" placeholder="R$" step="0.01" class="flex-1" value="${item.val}" onkeyup="updateItemData(${item.id}, 'val', this.value)" onchange="updateItemData(${item.id}, 'val', this.value)">
                        <button type="button" class="btn-remove" onclick="removeItem(${item.id})">X</button>
                    </div>
                `;
            });
        }

        // Renderiza as linhas na tabela do layout A4 e calcula os totais
        function renderPreviewItems() {
            const tbody = document.getElementById('out-items-body');
            tbody.innerHTML = '';
            let subtotal = 0;

            items.forEach((item, index) => {
                const totalItem = item.qtd * item.val;
                subtotal += totalItem;
                const num = String(index + 1).padStart(2, '0');

                tbody.innerHTML += `
                    <tr>
                        <td class="center">${num}</td>
                        <td>${item.desc || '-'}</td>
                        <td class="center">${item.qtd}</td>
                        <td class="right">${formatMoney(item.val)}</td>
                        <td class="right">${formatMoney(totalItem)}</td>
                    </tr>
                `;
            });

            calculateTotals(subtotal);
        }

        // Calcula totais com desconto
        function calculateTotals(calculatedSub = null) {
            if (calculatedSub === null) {
                calculatedSub = items.reduce((acc, item) => acc + (item.qtd * item.val), 0);
            }

            const descInput = parseFloat(document.getElementById('in-desconto').value) || 0;
            const totalGeral = calculatedSub - descInput;

            document.getElementById('out-subtotal').innerText = `R$ ${formatMoney(calculatedSub)}`;
            document.getElementById('out-desconto').innerText = `R$ ${formatMoney(descInput)}`;
            document.getElementById('out-total').innerText = `R$ ${formatMoney(totalGeral < 0 ? 0 : totalGeral)}`;
        }

        // Inicializar os campos para garantir que a assinatura espelhe o input inicial
        updateField('emp-nome');

        // Configura a data de hoje automaticamente
        const today = new Date();
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const dateStr = today.toLocaleDateString('pt-BR', options);
        const inData = document.getElementById('in-data');
        if (inData) {
            inData.value = dateStr;
            updateField('data');
        }

        // Configura número aleatório para a OS
        const currentYear = today.getFullYear();
        const randomOS = Math.floor(1000 + Math.random() * 9000); // Gera um número de 4 dígitos
        const osString = `${randomOS}/${currentYear}`;
        const inOS = document.getElementById('in-os');
        if (inOS) {
            inOS.value = osString;
            updateField('os');
        }


        // Lógica de instalação do PWA via Botão
        let deferredPrompt;
        const installBtn = document.getElementById('btn-install');

        window.addEventListener('beforeinstallprompt', (e) => {
            // Impede que o mini-infobar apareça no mobile automaticamente
            e.preventDefault();
            // Salva o evento para ser disparado depois
            deferredPrompt = e;
            // Mostra o botão de instalação
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Mostra o prompt de instalação
                deferredPrompt.prompt();
                // Espera a resposta do usuário
                const { outcome } = await deferredPrompt.userChoice;
                // Esconde o botão após a escolha
                // installBtn.style.display = 'none'; // Mantido visível conforme solicitado
                deferredPrompt = null;
            } else {
                alert('A instalação não está disponível no momento.\n\nIsso geralmente acontece porque o arquivo foi aberto localmente (file://) sem HTTPS ou Servidor Local. Para instalar no celular, você precisa hospedar esses arquivos na internet.');
            }
        });

        // Inicia com 1 item em branco
        if (items.length === 0) addItem();

        // Registra o Service Worker (PWA)
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('./sw.js')
                    .then(reg => console.log('PWA Service Worker registrado com sucesso!', reg))
                    .catch(err => console.error('Erro ao registrar o Service Worker do PWA', err));
            });
        }