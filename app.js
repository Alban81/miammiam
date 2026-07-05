(() => {
  'use strict';

  const STORAGE_KEY = 'miammiam-state-v1';
  const APP_VERSION = '1.0.1';
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');

  let state = loadState();
  let stack = [{ name: 'meals', params: {} }];
  let renderDirection = 'forward';
  let toastTimer = null;
  const imageDrafts = new Map();

  const routesByTab = {
    meals: ['meals', 'mealManager', 'addMeal', 'deleteMeals', 'mealDetail', 'editMeal'],
    library: ['library', 'ingredientManager', 'addIngredient', 'deleteIngredients', 'otherManager', 'addOther', 'deleteOthers'],
    shopping: ['shoppingList']
  };

  function createId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function defaultState() {
    const sel = createId('ing');
    const huile = createId('ing');
    const fromage = createId('ing');
    const gnocchi = createId('ing');
    const jambon = createId('ing');
    const pain = createId('ing');
    const oeufs = createId('ing');
    const lait = createId('ing');
    const pates = createId('ing');
    const tomate = createId('ing');
    const eponge = createId('other');
    const lessive = createId('other');
    const savon = createId('other');

    return {
      version: APP_VERSION,
      extraNotes: '',
      items: [
        { id: sel, name: 'Sel', type: 'ingredient', quantity: 0 },
        { id: huile, name: 'Huile d’olive', type: 'ingredient', quantity: 0 },
        { id: fromage, name: 'Fromage râpé', type: 'ingredient', quantity: 0 },
        { id: gnocchi, name: 'Gnocchi', type: 'ingredient', quantity: 0 },
        { id: jambon, name: 'Jambon', type: 'ingredient', quantity: 0 },
        { id: pain, name: 'Pain de mie', type: 'ingredient', quantity: 0 },
        { id: oeufs, name: 'Œufs', type: 'ingredient', quantity: 0 },
        { id: lait, name: 'Lait', type: 'ingredient', quantity: 0 },
        { id: pates, name: 'Pâtes à lasagnes', type: 'ingredient', quantity: 0 },
        { id: tomate, name: 'Sauce tomate', type: 'ingredient', quantity: 0 },
        { id: eponge, name: 'Éponge', type: 'other', quantity: 0 },
        { id: lessive, name: 'Lessive', type: 'other', quantity: 0 },
        { id: savon, name: 'Savon', type: 'other', quantity: 0 }
      ],
      meals: [
        {
          id: createId('meal'),
          name: 'Gnocchi à la poêle',
          ingredientIds: [gnocchi, sel, huile, fromage],
          imageData: '',
          recipe: 'Faire chauffer un filet d’huile d’olive dans une poêle. Ajouter les gnocchi et les faire dorer quelques minutes. Saler, ajouter le fromage râpé et servir chaud.',
          favorite: true,
          createdAt: Date.now()
        },
        {
          id: createId('meal'),
          name: 'Croque monsieur',
          ingredientIds: [pain, jambon, fromage],
          imageData: '',
          recipe: 'Garnir deux tranches de pain de mie avec du jambon et du fromage. Faire griller à la poêle ou au four jusqu’à ce que le fromage fonde.',
          favorite: false,
          createdAt: Date.now() + 1
        },
        {
          id: createId('meal'),
          name: 'Quiche',
          ingredientIds: [oeufs, lait, fromage, sel],
          imageData: '',
          recipe: 'Mélanger les œufs, le lait, le sel et le fromage. Verser dans une pâte et cuire au four jusqu’à ce que la quiche soit dorée.',
          favorite: false,
          createdAt: Date.now() + 2
        },
        {
          id: createId('meal'),
          name: 'Omelette',
          ingredientIds: [oeufs, sel, fromage],
          imageData: '',
          recipe: 'Battre les œufs avec une pincée de sel. Cuire à la poêle. Ajouter le fromage en fin de cuisson.',
          favorite: false,
          createdAt: Date.now() + 3
        },
        {
          id: createId('meal'),
          name: 'Lasagnes',
          ingredientIds: [pates, tomate, fromage, sel],
          imageData: '',
          recipe: 'Alterner les couches de pâtes, sauce tomate et fromage. Cuire au four jusqu’à obtenir une surface gratinée.',
          favorite: false,
          createdAt: Date.now() + 4
        }
      ]
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const loaded = JSON.parse(raw);
      return normalizeState(loaded);
    } catch (error) {
      console.warn('Impossible de lire les données MiamMiam. Réinitialisation locale.', error);
      return defaultState();
    }
  }

  function normalizeState(loaded) {
    const fresh = defaultState();
    const normalized = {
      version: loaded.version || APP_VERSION,
      extraNotes: typeof loaded.extraNotes === 'string' ? loaded.extraNotes : '',
      items: Array.isArray(loaded.items) ? loaded.items : fresh.items,
      meals: Array.isArray(loaded.meals) ? loaded.meals : fresh.meals
    };

    normalized.items = normalized.items.map(item => ({
      id: item.id || createId('item'),
      name: cleanText(item.name) || 'Sans nom',
      type: item.type === 'other' ? 'other' : 'ingredient',
      quantity: clampQuantity(item.quantity)
    }));

    const itemIds = new Set(normalized.items.map(item => item.id));
    normalized.meals = normalized.meals.map(meal => ({
      id: meal.id || createId('meal'),
      name: cleanText(meal.name) || 'Repas sans nom',
      ingredientIds: Array.isArray(meal.ingredientIds) ? meal.ingredientIds.filter(id => itemIds.has(id)) : [],
      imageData: typeof meal.imageData === 'string' ? meal.imageData : '',
      recipe: typeof meal.recipe === 'string' ? meal.recipe : '',
      favorite: Boolean(meal.favorite),
      createdAt: Number.isFinite(meal.createdAt) ? meal.createdAt : Date.now()
    }));

    return normalized;
  }

  function saveState({ silent = false } = {}) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      if (!silent) showToast('Modifications enregistrées');
    } catch (error) {
      console.error(error);
      showToast('Stockage plein : supprime une image ou exporte tes données');
    }
  }

  function cleanText(value) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  function esc(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function clampQuantity(value) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number) || number < 0) return 0;
    return number;
  }

  function getMeal(mealId) {
    return state.meals.find(meal => meal.id === mealId);
  }

  function getItem(itemId) {
    return state.items.find(item => item.id === itemId);
  }

  function getItemsByType(type) {
    return state.items
      .filter(item => item.type === type)
      .sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }

  function sortedMeals() {
    return [...state.meals].sort((a, b) => {
      if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
    });
  }

  function currentScreen() {
    return stack[stack.length - 1];
  }

  function currentTabName() {
    const screenName = currentScreen().name;
    if (routesByTab.library.includes(screenName)) return 'library';
    if (routesByTab.shopping.includes(screenName)) return 'shopping';
    return 'meals';
  }

  function navigate(name, params = {}) {
    stack.push({ name, params });
    renderDirection = 'forward';
    render();
  }

  function replace(name, params = {}) {
    stack[stack.length - 1] = { name, params };
    renderDirection = 'forward';
    render();
  }

  function back() {
    if (stack.length > 1) {
      stack.pop();
      renderDirection = 'back';
      render();
      return;
    }
    goTab('meals');
  }

  function goTab(tab) {
    const route = tab === 'library' ? 'library' : tab === 'shopping' ? 'shoppingList' : 'meals';
    stack = [{ name: route, params: {} }];
    renderDirection = 'forward';
    render();
  }

  function render({ preserveScroll = false } = {}) {
    const previousScrollY = preserveScroll ? window.scrollY : 0;
    const screen = currentScreen();
    const route = routeRegistry[screen.name];
    const view = route ? route(screen.params) : routeRegistry.meals({});
    app.innerHTML = `<div class="view ${renderDirection === 'back' ? 'back' : ''}">${view.html}${bottomTabs()}</div>`;
    if (typeof view.afterRender === 'function') view.afterRender();

    if (preserveScroll) {
      window.requestAnimationFrame(() => window.scrollTo(0, previousScrollY));
    } else {
      window.scrollTo(0, 0);
    }
  }

  function topBar(title, { backButton = true, trailing = '' } = {}) {
    return `
      <header class="topbar">
        <div>${backButton ? '<button class="back-button" data-action="back" aria-label="Retour"><span class="back-chevron">‹</span><span>Retour</span></button>' : ''}</div>
        <h1 class="topbar-title">${esc(title)}</h1>
        <div>${trailing}</div>
      </header>
    `;
  }

  function page(title, content, options = {}) {
    return `${topBar(title, options)}<main class="page">${content}</main>`;
  }

  function bottomTabs() {
    const active = currentTabName();
    return `
      <nav class="bottom-tabs" aria-label="Menu principal">
        ${tabButton('library', 'Bibliothèque', '◉', active)}
        ${tabButton('meals', 'Repas', '⌂', active)}
        ${tabButton('shopping', 'Courses', '🛒', active)}
      </nav>
    `;
  }

  function tabButton(tab, label, icon, active) {
    return `
      <button class="tab-button ${active === tab ? 'active' : ''}" data-action="go-tab" data-tab="${tab}" aria-label="${esc(label)}">
        <span class="tab-icon" aria-hidden="true">${icon}</span>
        <span>${esc(label)}</span>
      </button>
    `;
  }

  function placeholderThumb() {
    return '<div class="meal-thumb" aria-hidden="true">🍽️</div>';
  }

  function mealThumb(meal) {
    if (!meal.imageData) return placeholderThumb();
    return `<img class="meal-thumb" src="${esc(meal.imageData)}" alt="Image du repas ${esc(meal.name)}">`;
  }

  function mealCard(meal) {
    const count = meal.ingredientIds.length;
    return `
      <article class="card meal-card">
        <button data-action="open-meal" data-meal-id="${esc(meal.id)}" aria-label="Ouvrir ${esc(meal.name)}">
          ${mealThumb(meal)}
        </button>
        <button data-action="open-meal" data-meal-id="${esc(meal.id)}" style="text-align:left; min-width:0" aria-label="Ouvrir ${esc(meal.name)}">
          <h2 class="meal-title">${esc(meal.name)}</h2>
          <p class="meal-subtitle">${count} ingrédient${count > 1 ? 's' : ''}</p>
        </button>
        <button class="star-button ${meal.favorite ? 'is-favorite' : ''}" data-action="toggle-favorite" data-meal-id="${esc(meal.id)}" aria-label="${meal.favorite ? 'Retirer des favoris' : 'Mettre en favori'}">★</button>
      </article>
    `;
  }

  function renderMeals() {
    const meals = sortedMeals();
    const content = `
      <section class="hero">
        <h2>MiamMiam</h2>
        <p>Choisis un repas, consulte sa recette, puis ajoute ses ingrédients aux prochaines courses.</p>
      </section>
      <div class="section-title-row">
        <h2>Repas</h2>
        <span class="note">${meals.length} repas</span>
      </div>
      ${meals.length ? `<div class="list">${meals.map(mealCard).join('')}</div>` : emptyState('Aucun repas', 'Ajoute ton premier repas pour commencer.')}
    `;
    return { html: page('Repas', content, {
      backButton: false,
      trailing: '<button class="topbar-action" data-action="navigate" data-route="mealManager">Modifier</button>'
    }) };
  }

  function renderMealManager() {
    const content = `
      <section class="hero">
        <h2>Modifier les repas</h2>
        <p>Ajoute un nouveau repas ou supprime ceux dont tu ne veux plus.</p>
      </section>
      <div class="button-stack">
        <button class="primary-button" data-action="navigate" data-route="addMeal">Ajouter un repas</button>
        <button class="secondary-button" data-action="navigate" data-route="deleteMeals">Supprimer des repas</button>
      </div>
    `;
    return { html: page('Modifier les repas', content) };
  }

  function ingredientCheckboxes(selectedIds = []) {
    const selected = new Set(selectedIds);
    const ingredients = getItemsByType('ingredient');
    if (!ingredients.length) {
      return `<p class="note">Aucun ingrédient n’existe pour l’instant. Va dans Bibliothèque → Modifier → Ajouter un élément.</p>`;
    }
    return `<div class="check-list">${ingredients.map(item => `
      <label class="check-row">
        <input type="checkbox" name="ingredientIds" value="${esc(item.id)}" ${selected.has(item.id) ? 'checked' : ''}>
        <span>${esc(item.name)}</span>
      </label>
    `).join('')}</div>`;
  }

  function renderAddMeal() {
    const draftKey = 'addMeal';
    const content = mealForm({ mode: 'add', draftKey });
    return {
      html: page('Ajouter un repas', content),
      afterRender: () => bindMealForm({ mode: 'add', draftKey })
    };
  }

  function renderEditMeal({ mealId }) {
    const meal = getMeal(mealId);
    if (!meal) return missingMealView();
    const draftKey = `editMeal:${meal.id}`;
    if (!imageDrafts.has(draftKey)) imageDrafts.set(draftKey, meal.imageData || '');
    const content = mealForm({ mode: 'edit', meal, draftKey });
    return {
      html: page('Modifier le repas', content),
      afterRender: () => bindMealForm({ mode: 'edit', meal, draftKey })
    };
  }

  function mealForm({ mode, meal = null, draftKey }) {
    const isEdit = mode === 'edit';
    const imageData = imageDrafts.has(draftKey) ? imageDrafts.get(draftKey) : (meal?.imageData || '');
    return `
      <form class="form" id="meal-form" novalidate>
        <div class="field-card">
          <label for="meal-name">Nom du repas</label>
          <input class="text-input" id="meal-name" name="name" type="text" maxlength="80" placeholder="Ex. Gnocchi à la poêle" value="${esc(meal?.name || '')}" required>
        </div>
        <div class="field-card">
          <div class="field-label">Ingrédients nécessaires</div>
          ${ingredientCheckboxes(meal?.ingredientIds || [])}
        </div>
        <div class="field-card">
          <label for="meal-image">Image du repas</label>
          <div class="image-preview" id="image-preview">${imageData ? `<img src="${esc(imageData)}" alt="Aperçu de l’image du repas">` : '<span>Aucune image sélectionnée</span>'}</div>
          <input class="file-input" id="meal-image" name="image" type="file" accept="image/*">
          ${imageData ? '<button type="button" class="secondary-button" data-action="remove-draft-image" data-draft-key="' + esc(draftKey) + '">Supprimer l’image</button>' : ''}
        </div>
        <div class="field-card">
          <label for="meal-recipe">Recette</label>
          <textarea class="textarea" id="meal-recipe" name="recipe" maxlength="4000" placeholder="Écris les étapes de la recette...">${esc(meal?.recipe || '')}</textarea>
        </div>
        <button class="primary-button" type="submit">Valider</button>
        <p class="note">L’application sauvegarde tout localement sur ce téléphone et fonctionne sans compte.</p>
      </form>
    `;
  }

  function bindMealForm({ mode, meal = null, draftKey }) {
    const form = document.getElementById('meal-form');
    const fileInput = document.getElementById('meal-image');
    const preview = document.getElementById('image-preview');

    if (fileInput && preview) {
      fileInput.addEventListener('change', async event => {
        const file = event.target.files?.[0];
        if (!file) return;
        try {
          const dataUrl = await imageFileToDataUrl(file);
          imageDrafts.set(draftKey, dataUrl);
          preview.innerHTML = `<img src="${esc(dataUrl)}" alt="Aperçu de l’image du repas">`;
          showToast('Image ajoutée');
        } catch (error) {
          console.error(error);
          showToast('Impossible de lire cette image');
        }
      });
    }

    if (!form) return;
    form.addEventListener('submit', event => {
      event.preventDefault();
      const formData = new FormData(form);
      const name = cleanText(formData.get('name'));
      const recipe = String(formData.get('recipe') || '').trim();
      const ingredientIds = formData.getAll('ingredientIds').map(String);
      const imageData = imageDrafts.get(draftKey) || '';

      if (!name) {
        showToast('Le nom du repas est obligatoire');
        document.getElementById('meal-name')?.focus();
        return;
      }

      if (mode === 'edit' && meal) {
        meal.name = name;
        meal.recipe = recipe;
        meal.ingredientIds = ingredientIds;
        meal.imageData = imageData;
        saveState();
        imageDrafts.delete(draftKey);
        replace('mealDetail', { mealId: meal.id });
        return;
      }

      const newMeal = {
        id: createId('meal'),
        name,
        ingredientIds,
        imageData,
        recipe,
        favorite: false,
        createdAt: Date.now()
      };
      state.meals.push(newMeal);
      saveState();
      imageDrafts.delete(draftKey);
      stack = [{ name: 'meals', params: {} }];
      renderDirection = 'back';
      render();
    });
  }

  function renderDeleteMeals() {
    const meals = sortedMeals();
    const content = `
      <form class="form" id="delete-meals-form">
        <section class="field-card">
          <div class="field-label">Repas à supprimer</div>
          ${meals.length ? `<div class="check-list">${meals.map(meal => `
            <label class="check-row">
              <input type="checkbox" name="mealIds" value="${esc(meal.id)}">
              <span>${esc(meal.name)}</span>
            </label>
          `).join('')}</div>` : '<p class="note">Aucun repas à supprimer.</p>'}
        </section>
        <button class="danger-button" type="submit" ${meals.length ? '' : 'disabled'}>Valider</button>
        <p class="note">Les ingrédients restent dans la Bibliothèque. Seuls les repas cochés sont supprimés.</p>
      </form>
    `;
    return {
      html: page('Supprimer des repas', content),
      afterRender: () => {
        document.getElementById('delete-meals-form')?.addEventListener('submit', event => {
          event.preventDefault();
          const ids = new FormData(event.currentTarget).getAll('mealIds').map(String);
          if (!ids.length) return showToast('Aucun repas sélectionné');
          state.meals = state.meals.filter(meal => !ids.includes(meal.id));
          saveState();
          stack = [{ name: 'meals', params: {} }];
          renderDirection = 'back';
          render();
        });
      }
    };
  }

  function renderMealDetail({ mealId }) {
    const meal = getMeal(mealId);
    if (!meal) return missingMealView();
    const ingredients = meal.ingredientIds.map(getItem).filter(Boolean);
    const content = `
      ${meal.imageData ? `<img class="meal-detail-image" src="${esc(meal.imageData)}" alt="Image du repas ${esc(meal.name)}">` : '<section class="hero"><h2>🍽️</h2><p>Aucune image pour ce repas.</p></section>'}
      <div class="section-title-row"><h2>Ingrédients</h2></div>
      ${ingredients.length ? `<div class="list">${ingredients.map(item => `
        <div class="item-row">
          <span class="item-name">${esc(item.name)}</span>
          <span class="note">recette</span>
        </div>
      `).join('')}</div>` : emptyState('Aucun ingrédient', 'Modifie ce repas pour sélectionner ses ingrédients.')}
      <div class="section-title-row"><h2>Recette</h2></div>
      <section class="field-card"><p class="recipe-text">${esc(meal.recipe || 'Aucune recette écrite pour ce repas.')}</p></section>
      <div class="section-title-row"><h2>Pour les courses</h2></div>
      ${ingredients.length ? `<div class="list">${ingredients.map(item => itemRowWithCounter(item)).join('')}</div>` : emptyState('Rien à ajouter', 'Ajoute d’abord des ingrédients à ce repas.')}
      <p class="note">Augmente la quantité d’un ingrédient pour l’ajouter automatiquement à la liste de courses.</p>
    `;
    return { html: page(meal.name, content, {
      trailing: `<button class="topbar-action" data-action="navigate" data-route="editMeal" data-meal-id="${esc(meal.id)}">Modifier</button>`
    }) };
  }

  function renderLibrary() {
    const ingredients = getItemsByType('ingredient');
    const others = getItemsByType('other');
    const content = `
      <section class="hero">
        <h2>Bibliothèque</h2>
        <p>Tous les éléments que tu peux acheter. Les quantités modifiées ici alimentent directement la liste de courses.</p>
      </section>
      <div class="section-title-row">
        <h2>Ingrédients</h2>
        <button class="mini-action" data-action="navigate" data-route="ingredientManager">Modifier</button>
      </div>
      ${ingredients.length ? `<div class="list">${ingredients.map(item => itemRowWithCounter(item)).join('')}</div>` : emptyState('Aucun ingrédient', 'Ajoute les ingrédients utilisés dans tes recettes.')}
      <div class="section-title-row">
        <h2>Autres</h2>
        <button class="mini-action" data-action="navigate" data-route="otherManager">Modifier</button>
      </div>
      ${others.length ? `<div class="list">${others.map(item => itemRowWithCounter(item)).join('')}</div>` : emptyState('Aucun autre élément', 'Ajoute les produits qui ne sont pas des ingrédients.')}
      <div class="section-title-row"><h2>En plus</h2></div>
      <section class="field-card">
        <label for="extra-notes">Notes pour les prochaines courses</label>
        <textarea class="textarea" id="extra-notes" maxlength="2000" placeholder="Ex. piles, sac poubelle, produit exceptionnel...">${esc(state.extraNotes)}</textarea>
        <p class="note">Ce texte apparaîtra en bas de la liste de courses s’il n’est pas vide.</p>
      </section>
    `;
    return {
      html: page('Bibliothèque', content, { backButton: false }),
      afterRender: () => {
        const notes = document.getElementById('extra-notes');
        if (!notes) return;
        let timer = null;
        notes.addEventListener('input', () => {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            state.extraNotes = notes.value.trim();
            saveState({ silent: true });
          }, 250);
        });
        notes.addEventListener('blur', () => {
          state.extraNotes = notes.value.trim();
          saveState({ silent: true });
        });
      }
    };
  }

  function renderIngredientManager() {
    const content = managerContent('Ingrédients', 'addIngredient', 'deleteIngredients');
    return { html: page('Modifier ingrédients', content) };
  }

  function renderOtherManager() {
    const content = managerContent('Autres', 'addOther', 'deleteOthers');
    return { html: page('Modifier autres', content) };
  }

  function managerContent(label, addRoute, deleteRoute) {
    return `
      <section class="hero">
        <h2>Modifier ${esc(label.toLowerCase())}</h2>
        <p>Ajoute ou supprime les éléments de cette catégorie.</p>
      </section>
      <div class="button-stack">
        <button class="primary-button" data-action="navigate" data-route="${esc(addRoute)}">Ajouter un élément</button>
        <button class="secondary-button" data-action="navigate" data-route="${esc(deleteRoute)}">Supprimer des éléments</button>
      </div>
    `;
  }

  function renderAddItem(type) {
    const isIngredient = type === 'ingredient';
    const title = isIngredient ? 'Ajouter ingrédient' : 'Ajouter autre';
    const content = `
      <form class="form" id="add-item-form" novalidate>
        <section class="field-card">
          <label for="item-name">Nom</label>
          <input class="text-input" id="item-name" name="name" type="text" maxlength="70" placeholder="${isIngredient ? 'Ex. Riz' : 'Ex. Éponge'}" required>
        </section>
        <button class="primary-button" type="submit">Valider</button>
      </form>
    `;
    return {
      html: page(title, content),
      afterRender: () => {
        document.getElementById('item-name')?.focus({ preventScroll: true });
        document.getElementById('add-item-form')?.addEventListener('submit', event => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const name = cleanText(formData.get('name'));
          if (!name) return showToast('Le nom est obligatoire');
          const duplicate = state.items.some(item => item.type === type && item.name.localeCompare(name, 'fr', { sensitivity: 'base' }) === 0);
          if (duplicate) return showToast('Cet élément existe déjà');
          state.items.push({ id: createId(isIngredient ? 'ing' : 'other'), name, type, quantity: 0 });
          saveState();
          stack = [{ name: 'library', params: {} }];
          renderDirection = 'back';
          render();
        });
      }
    };
  }

  function renderDeleteItems(type) {
    const isIngredient = type === 'ingredient';
    const title = isIngredient ? 'Supprimer ingrédients' : 'Supprimer autres';
    const items = getItemsByType(type);
    const content = `
      <form class="form" id="delete-items-form">
        <section class="field-card">
          <div class="field-label">Éléments à supprimer</div>
          ${items.length ? `<div class="check-list">${items.map(item => `
            <label class="check-row">
              <input type="checkbox" name="itemIds" value="${esc(item.id)}">
              <span>${esc(item.name)}</span>
            </label>
          `).join('')}</div>` : '<p class="note">Aucun élément à supprimer.</p>'}
        </section>
        ${isIngredient ? '<p class="note">Si un ingrédient est supprimé, il disparaît aussi des recettes qui l’utilisaient.</p>' : ''}
        <button class="danger-button" type="submit" ${items.length ? '' : 'disabled'}>Valider</button>
      </form>
    `;
    return {
      html: page(title, content),
      afterRender: () => {
        document.getElementById('delete-items-form')?.addEventListener('submit', event => {
          event.preventDefault();
          const ids = new FormData(event.currentTarget).getAll('itemIds').map(String);
          if (!ids.length) return showToast('Aucun élément sélectionné');
          deleteItemIds(ids);
          saveState();
          stack = [{ name: 'library', params: {} }];
          renderDirection = 'back';
          render();
        });
      }
    };
  }

  function renderShoppingList() {
    const selectedItems = [...state.items]
      .filter(item => item.quantity > 0)
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'ingredient' ? -1 : 1;
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      });
    const hasNotes = state.extraNotes.trim().length > 0;
    const content = `
      <section class="hero">
        <h2>Liste courses</h2>
        <p>Tout ce qui a une quantité supérieure à zéro apparaît ici.</p>
      </section>
      ${selectedItems.length || hasNotes ? `
        <div class="list">
          ${selectedItems.map(item => `
            <div class="shopping-row">
              <span class="shopping-name">${esc(item.name)}</span>
              <strong>× ${item.quantity}</strong>
            </div>
          `).join('')}
          ${hasNotes ? `<section class="field-card"><div class="field-label">En plus</div><p class="recipe-text">${esc(state.extraNotes.trim())}</p></section>` : ''}
        </div>
      ` : emptyState('Liste vide', 'Ajoute des quantités depuis un repas ou depuis la Bibliothèque.')}
      <div class="button-stack">
        <button class="danger-button" data-action="reset-shopping" ${selectedItems.length || hasNotes ? '' : 'disabled'}>Réinitialiser</button>
      </div>
      <p class="note">La réinitialisation remet à zéro toutes les quantités et efface la zone « En plus ».</p>
    `;
    return { html: page('Liste courses', content, { backButton: false }) };
  }

  function itemRowWithCounter(item) {
    return `
      <div class="item-row">
        <span class="item-name">${esc(item.name)}</span>
        ${counter(item)}
      </div>
    `;
  }

  function counter(item) {
    const qty = clampQuantity(item.quantity);
    return `
      <span class="counter" role="group" aria-label="Quantité de ${esc(item.name)}">
        <button data-action="adjust-quantity" data-item-id="${esc(item.id)}" data-delta="-1" ${qty <= 0 ? 'disabled' : ''} aria-label="Retirer un ${esc(item.name)}">−</button>
        <output>${qty}</output>
        <button data-action="adjust-quantity" data-item-id="${esc(item.id)}" data-delta="1" aria-label="Ajouter un ${esc(item.name)}">+</button>
      </span>
    `;
  }

  function emptyState(title, text) {
    return `<section class="empty-state"><strong>${esc(title)}</strong><span>${esc(text)}</span></section>`;
  }

  function missingMealView() {
    const content = `${emptyState('Repas introuvable', 'Ce repas a peut-être été supprimé.')}<div class="button-stack"><button class="primary-button" data-action="go-tab" data-tab="meals">Retour aux repas</button></div>`;
    return { html: page('Repas introuvable', content) };
  }

  function deleteItemIds(ids) {
    const idSet = new Set(ids);
    state.items = state.items.filter(item => !idSet.has(item.id));
    state.meals.forEach(meal => {
      meal.ingredientIds = meal.ingredientIds.filter(id => !idSet.has(id));
    });
  }

  function adjustQuantity(itemId, delta) {
    const item = getItem(itemId);
    if (!item) return;
    item.quantity = Math.max(0, clampQuantity(item.quantity) + delta);
    saveState({ silent: true });
    renderDirection = 'forward';
    render({ preserveScroll: true });
  }

  function showToast(message) {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 1900);
  }

  function bindGlobalEvents() {
    app.addEventListener('click', event => {
      const button = event.target.closest('[data-action]');
      if (!button) return;
      const action = button.dataset.action;

      if (action === 'back') return back();
      if (action === 'go-tab') return goTab(button.dataset.tab);
      if (action === 'navigate') {
        const route = button.dataset.route;
        const params = {};
        if (button.dataset.mealId) params.mealId = button.dataset.mealId;
        return navigate(route, params);
      }
      if (action === 'open-meal') return navigate('mealDetail', { mealId: button.dataset.mealId });
      if (action === 'toggle-favorite') {
        const meal = getMeal(button.dataset.mealId);
        if (!meal) return;
        meal.favorite = !meal.favorite;
        saveState({ silent: true });
        render();
        return;
      }
      if (action === 'adjust-quantity') {
        return adjustQuantity(button.dataset.itemId, Number.parseInt(button.dataset.delta, 10));
      }
      if (action === 'remove-draft-image') {
        imageDrafts.set(button.dataset.draftKey, '');
        render();
        return showToast('Image supprimée');
      }
      if (action === 'reset-shopping') {
        const confirmed = window.confirm('Réinitialiser toute la liste de courses ?');
        if (!confirmed) return;
        state.items.forEach(item => { item.quantity = 0; });
        state.extraNotes = '';
        saveState();
        render();
      }
    });

    let startX = 0;
    let startY = 0;
    let startTime = 0;
    document.addEventListener('touchstart', event => {
      if (!event.touches || event.touches.length !== 1) return;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      startTime = Date.now();
    }, { passive: true });

    document.addEventListener('touchend', event => {
      if (!event.changedTouches || event.changedTouches.length !== 1 || stack.length <= 1) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      const duration = Date.now() - startTime;
      const fromLeftEdge = startX < 38 && dx > 70;
      const fromRightEdge = startX > window.innerWidth - 38 && dx < -70;
      const isFastHorizontal = Math.abs(dx) > 95 && Math.abs(dy) < 55 && duration < 650;
      if ((fromLeftEdge || fromRightEdge || isFastHorizontal) && Math.abs(dx) > Math.abs(dy) * 1.5) {
        back();
      }
    }, { passive: true });
  }

  async function imageFileToDataUrl(file) {
    if (!file.type.startsWith('image/')) throw new Error('Le fichier sélectionné n’est pas une image.');
    const rawDataUrl = await readFileAsDataUrl(file);
    const image = await loadImage(rawDataUrl);
    const maxSide = 1100;
    const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * ratio));
    const height = Math.max(1, Math.round(image.height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.84);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  const routeRegistry = {
    meals: renderMeals,
    mealManager: renderMealManager,
    addMeal: renderAddMeal,
    deleteMeals: renderDeleteMeals,
    mealDetail: renderMealDetail,
    editMeal: renderEditMeal,
    library: renderLibrary,
    ingredientManager: renderIngredientManager,
    addIngredient: () => renderAddItem('ingredient'),
    deleteIngredients: () => renderDeleteItems('ingredient'),
    otherManager: renderOtherManager,
    addOther: () => renderAddItem('other'),
    deleteOthers: () => renderDeleteItems('other'),
    shoppingList: renderShoppingList
  };

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(error => {
        console.warn('Service worker non enregistré.', error);
      });
    });
  }

  bindGlobalEvents();
  render();
})();
