(function(){
  // Smart analytics engine with realistic values
  class SmartFoodAnalytics {
    constructor() {
      this.commonItems = {
        eggs: { 
          shelf_life: 21, 
          typical_consumption: { daily: 2, weekly: 14 },
          calories_per_unit: 70,        // per egg
          protein_per_unit: 6,          // per egg
          category: 'dairy',
          unit_type: 'piece'
        },
        milk: { 
          shelf_life: 7, 
          typical_consumption: { daily: 250, weekly: 1750 },
          calories_per_unit: 60,        // per 250ml glass
          protein_per_unit: 8,          // per 250ml glass
          category: 'dairy',
          unit_type: 'ml'
        },
        bread: { 
          shelf_life: 5, 
          typical_consumption: { daily: 4, weekly: 28 }, // slices
          calories_per_unit: 80,        // per slice
          protein_per_unit: 3,          // per slice
          category: 'bakery',
          unit_type: 'slice'
        },
        chicken: { 
          shelf_life: 3, 
          typical_consumption: { daily: 150, weekly: 1050 }, // grams
          calories_per_unit: 165,       // per 100g
          protein_per_unit: 31,         // per 100g
          category: 'meat',
          unit_type: 'g'
        },
        rice: {
          shelf_life: 365,
          typical_consumption: { daily: 150, weekly: 1050 },
          calories_per_unit: 130,       // per 100g cooked
          protein_per_unit: 2.7,        // per 100g cooked
          category: 'grains',
          unit_type: 'g'
        },
        bananas: {
          shelf_life: 7,
          typical_consumption: { daily: 1, weekly: 7 },
          calories_per_unit: 105,       // per banana
          protein_per_unit: 1.3,        // per banana
          category: 'fruits',
          unit_type: 'piece'
        },
        yogurt: {
          shelf_life: 14,
          typical_consumption: { daily: 100, weekly: 700 },
          calories_per_unit: 59,        // per 100g
          protein_per_unit: 10,         // per 100g
          category: 'dairy',
          unit_type: 'g'
        }
      };
    }

    predictExpiry(purchases) {
      return purchases.map(item => {
        const itemInfo = this.commonItems[item.name?.toLowerCase()];
        if (!itemInfo) return item;
        
        const purchaseDate = new Date(item.date || new Date());
        const expiryDate = new Date(purchaseDate);
        expiryDate.setDate(expiryDate.getDate() + itemInfo.shelf_life);
        
        const daysUntilExpiry = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return {
          ...item,
          expiry_date: expiryDate,
          days_until_expiry: daysUntilExpiry,
          urgency: daysUntilExpiry <= 2 ? 'high' : daysUntilExpiry <= 5 ? 'medium' : 'low',
          suggestion: this.getConsumptionSuggestion(item, daysUntilExpiry)
        };
      });
    }

    getConsumptionSuggestion(item, daysLeft) {
      const suggestions = {
        eggs: {
          high: "🥚 Use today! Make omelette or boiled eggs",
          medium: "🍳 Perfect for breakfast or baking this week", 
          low: "✅ Stock is fresh, plan for next week"
        },
        milk: {
          high: "🥛 Use today in smoothies, coffee or cereal",
          medium: "☕ Good for daily use - cereals, tea, coffee", 
          low: "✅ Fresh stock, no immediate need"
        },
        chicken: {
          high: "🍗 Cook today! Great for curry or grilled dishes",
          medium: "🍲 Perfect for meals in next 2-3 days",
          low: "✅ Fresh chicken, plan meals accordingly"
        },
        bread: {
          high: "🍞 Use today! Make toast, sandwiches or croutons",
          medium: "🥪 Good for lunches and snacks this week",
          low: "✅ Fresh bread available"
        },
        bananas: {
          high: "🍌 Eat today! Perfect for smoothies or banana bread",
          medium: "🥤 Good for snacks or smoothies this week",
          low: "✅ Fresh bananas available"
        },
        yogurt: {
          high: "🥣 Consume today! Great with fruits or in smoothies",
          medium: "🍶 Good for breakfast or snacks this week",
          low: "✅ Fresh yogurt, no rush"
        }
      };
      
      const urgency = daysLeft <= 2 ? 'high' : daysLeft <= 5 ? 'medium' : 'low';
      return suggestions[item.name?.toLowerCase()]?.[urgency] || `Use within ${daysLeft} days for best quality`;
    }

    calculateNutrition(purchases) {
      let totalCalories = 0;
      let totalProtein = 0;
      
      purchases.forEach(item => {
        const itemInfo = this.commonItems[item.name?.toLowerCase()];
        if (itemInfo && item.quantity) {
          let calories = 0;
          let protein = 0;
          
          switch(itemInfo.unit_type) {
            case 'ml':
              // For milk, assume 250ml = 1 serving
              calories = (itemInfo.calories_per_unit * item.quantity) / 250;
              protein = (itemInfo.protein_per_unit * item.quantity) / 250;
              break;
            case 'g':
              // For chicken, rice, yogurt - per 100g
              calories = (itemInfo.calories_per_unit * item.quantity) / 100;
              protein = (itemInfo.protein_per_unit * item.quantity) / 100;
              break;
            default:
              // For eggs, bread, bananas - per piece/slice
              calories = itemInfo.calories_per_unit * item.quantity;
              protein = itemInfo.protein_per_unit * item.quantity;
          }
          
          totalCalories += calories;
          totalProtein += protein;
        }
      });
      
      return {
        totalCalories: Math.round(totalCalories),
        totalProtein: Math.round(totalProtein),
        calorieGoal: 17500, // Realistic weekly goal (2500 calories/day × 7)
        proteinGoal: 455     // Realistic weekly goal (65g protein/day × 7)
      };
    }

    generateSmartCart(consumptionHistory) {
      // Realistic weekly consumption patterns
      const weeklyNeeds = {
        eggs: 14,       // 2 eggs per day
        milk: 3500,     // 500ml per day
        bread: 21,      // 3 slices per day
        chicken: 700,   // 100g per day
        rice: 1050,     // 150g per day
        bananas: 7,     // 1 banana per day
        yogurt: 700     // 100g per day
      };
      
      return Object.keys(weeklyNeeds).map(item => {
        const needed = weeklyNeeds[item];
        const currentStock = this.estimateCurrentStock(item, consumptionHistory);
        const toBuy = Math.max(0, needed - currentStock);
        
        return {
          item: item,
          quantity: toBuy,
          unit: item === 'milk' ? 'ml' : item === 'chicken' || item === 'rice' || item === 'yogurt' ? 'g' : 'units',
          priority: toBuy > (needed * 0.3) ? 'high' : 'low',
          reason: toBuy > 0 ? 
            `Based on your typical weekly usage` : 
            'Well stocked'
        };
      }).filter(item => item.quantity > 0);
    }

    estimateCurrentStock(itemName, history) {
      // Simple estimation - in real app, this would track actual inventory
      const recentPurchase = history.find(p => p.name === itemName);
      if (!recentPurchase) return 0;
      
      // Assume 50% consumed if purchased recently
      return Math.floor(recentPurchase.quantity * 0.5);
    }
  }

  const smartAnalytics = new SmartFoodAnalytics();

  // Realistic Kanishk demo data with configurable goals
  const kanishkDemoData = {
    user: {
      name: "Kanishk",
      weekly_budget: 1500, // Configurable in future
      health_goals: "Fitness & Nutrition",
      dietary_preferences: ["high-protein", "balanced"]
    },
    current_week: {
      spend: 1420,
      budget_remaining: 80,
      items_purchased: [
        { name: "eggs", quantity: 12, amount: 96, date: "2024-01-15" },
        { name: "milk", quantity: 2000, amount: 120, date: "2024-01-15" },
        { name: "chicken", quantity: 500, amount: 350, date: "2024-01-14" },
        { name: "bread", quantity: 14, amount: 70, date: "2024-01-14" },
        { name: "rice", quantity: 1000, amount: 80, date: "2024-01-13" },
        { name: "bananas", quantity: 6, amount: 48, date: "2024-01-15" },
        { name: "yogurt", quantity: 500, amount: 60, date: "2024-01-14" }
      ]
    }
  };

  async function loadSummary(){
    try {
      const data = await api.get('/insights/summary');
      renderKPIs(data);
    } catch(e) {
      console.error('summary fetch error', e);
    }
  }

  async function loadHeatmap(){
    try {
      const hm = await api.get('/insights/heatmap');
      const matrix = hm.matrix;
      window.renderHeatmap('#heatmap', matrix);
    } catch(e){ 
      console.error('heatmap error', e);
      // Fallback to mock heatmap if API fails
      const mockMatrix = Array.from({length:7}, ()=>Array.from({length:24}, ()=>Math.round(Math.random()*600)));
      window.renderHeatmap('#heatmap', mockMatrix);
    }
  }

  function renderKPIs(data){
    const kpidiv = document.getElementById('kpis');
    kpidiv.innerHTML = '';
    
    const user = AppState.getUser();
    const isKanishk = user && user.email === 'Kanishkmehto6518@gmail.com';
    
    if (isKanishk) {
      // Enhanced KPIs for Kanishk
      const nutrition = smartAnalytics.calculateNutrition(kanishkDemoData.current_week.items_purchased);
      const enhancedKPIs = [
        {title:'Weekly Spend', value: '₹' + kanishkDemoData.current_week.spend, icon: 'wallet'},
        {title:'Budget Left', value: '₹' + kanishkDemoData.current_week.budget_remaining, icon: 'chart-line'},
        {title:'Calories', value: (nutrition.totalCalories/1000).toFixed(1) + 'k', icon: 'apple-alt'},
        {title:'Protein', value: nutrition.totalProtein + 'g', icon: 'dumbbell'}
      ];
      
      enhancedKPIs.forEach(k=>{
        const col = document.createElement('div'); 
        col.className = 'col-md-3 col-sm-6 mb-3';
        col.innerHTML = `
          <div class="kpi text-center">
            <i class="fas fa-${k.icon} fa-2x mb-2"></i>
            <small>${k.title}</small>
            <div style="font-weight:700;font-size:20px">${k.value}</div>
          </div>
        `;
        kpidiv.appendChild(col);
      });
    } else {
      // Normal KPIs for other users
      const a = [
        {title:'Total this month', value: '₹' + (data.total_spend||0)},
        {title:'Avg order', value: '₹' + (data.avg_order_value||0)},
        {title:'Budget', value: (data.budget && data.budget.set) ? '₹' + data.budget.set + ` (${data.budget.percent}%)` : 'Not set'}
      ];
      a.forEach(k=>{
        const col = document.createElement('div'); 
        col.className = 'col-md-4';
        col.innerHTML = `<div class="kpi bg-white shadow-sm"><small>${k.title}</small><div style="font-weight:700;font-size:20px">${k.value}</div></div>`;
        kpidiv.appendChild(col);
      });
    }
  }

  function renderEnhancedDashboard() {
    console.log("Loading enhanced dashboard for Kanishk...");
    
    // Render nutrition tracking
    renderNutritionTracking();
    
    // Render expiry alerts
    renderExpiryAlerts();
    
    // Render smart shopping cart
    renderSmartCart();
    
    // Render health insights
    renderHealthInsights();
  }

  function renderNutritionTracking() {
    const nutrition = smartAnalytics.calculateNutrition(kanishkDemoData.current_week.items_purchased);
    const calorieProgress = (nutrition.totalCalories/nutrition.calorieGoal)*100;
    const proteinProgress = (nutrition.totalProtein/nutrition.proteinGoal)*100;
    
    const nutritionHTML = `
      <div class="nutrition-metrics">
        <div class="d-flex justify-content-between mb-2">
          <span><i class="fas fa-fire me-1"></i>Weekly Calories:</span>
          <strong>${(nutrition.totalCalories/1000).toFixed(1)}k / ${(nutrition.calorieGoal/1000).toFixed(1)}k</strong>
        </div>
        <div class="progress mb-3" style="height: 8px;">
          <div class="progress-bar bg-warning" style="width: ${Math.min(calorieProgress, 100)}%"></div>
        </div>
        
        <div class="d-flex justify-content-between mb-2">
          <span><i class="fas fa-dumbbell me-1"></i>Protein Intake:</span>
          <strong>${nutrition.totalProtein}g / ${nutrition.proteinGoal}g</strong>
        </div>
        <div class="progress mb-3" style="height: 8px;">
          <div class="progress-bar bg-success" style="width: ${Math.min(proteinProgress, 100)}%"></div>
        </div>
        
        <div class="text-center mt-3">
          <small class="text-muted">
            <i class="fas ${proteinProgress >= 90 ? 'fa-check-circle text-success' : 'fa-running'} me-1"></i>
            ${proteinProgress >= 90 ? 'Excellent protein progress!' : 'Good progress on nutrition goals'}
          </small>
        </div>
      </div>
    `;
    
    const nutritionElement = document.querySelector('.nutrition-metrics');
    if (nutritionElement) {
      nutritionElement.innerHTML = nutritionHTML;
    }
  }

  function renderExpiryAlerts() {
    const itemsWithExpiry = smartAnalytics.predictExpiry(kanishkDemoData.current_week.items_purchased);
    const expiringSoon = itemsWithExpiry.filter(item => item.days_until_expiry <= 5);
    
    let alertsHTML = '';
    
    if (expiringSoon.length === 0) {
      alertsHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          <strong>All items fresh!</strong> No expiry concerns this week.
        </div>
      `;
    } else {
      expiringSoon.forEach(item => {
        const alertClass = item.urgency === 'high' ? 'alert-warning' : 'alert-info';
        const icon = item.urgency === 'high' ? 'exclamation-triangle' : 'info-circle';
        
        alertsHTML += `
          <div class="alert ${alertClass} d-flex align-items-center mb-2">
            <i class="fas fa-${icon} me-2"></i>
            <div class="flex-grow-1">
              <strong>${item.name.charAt(0).toUpperCase() + item.name.slice(1)}</strong> 
              - Best in ${item.days_until_expiry} days
              <small class="d-block mt-1">${item.suggestion}</small>
            </div>
          </div>
        `;
      });
    }
    
    const alertsElement = document.getElementById('expiry-alerts');
    if (alertsElement) {
      alertsElement.innerHTML = alertsHTML;
    }
  }

  function renderSmartCart() {
    const smartCart = smartAnalytics.generateSmartCart(kanishkDemoData.current_week.items_purchased);
    
    const needToBuy = smartCart.filter(item => item.priority === 'high');
    const lowPriority = smartCart.filter(item => item.priority === 'low');
    
    let cartHTML = `
      <div class="row">
        <div class="col-md-6 mb-3">
          <div class="card border-primary h-100">
            <div class="card-body">
              <h6 class="card-title text-primary">
                <i class="fas fa-shopping-cart me-2"></i>Need This Week
              </h6>
              ${needToBuy.length > 0 ? `
                <ul class="list-unstyled mb-0">
                  ${needToBuy.map(item => `
                    <li class="mb-2">
                      <i class="fas fa-${getItemIcon(item.item)} me-2 text-primary"></i>
                      <strong>${item.item.charAt(0).toUpperCase() + item.item.slice(1)}</strong> 
                      - ${item.quantity}${item.unit}
                      <small class="d-block text-muted">${item.reason}</small>
                    </li>
                  `).join('')}
                </ul>
              ` : '<p class="text-muted mb-0">All essential items stocked!</p>'}
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-3">
          <div class="card border-info h-100">
            <div class="card-body">
              <h6 class="card-title text-info">
                <i class="fas fa-list-alt me-2"></i>Consider Adding
              </h6>
              ${lowPriority.length > 0 ? `
                <ul class="list-unstyled mb-0">
                  ${lowPriority.map(item => `
                    <li class="mb-2">
                      <i class="fas fa-${getItemIcon(item.item)} me-2 text-info"></i>
                      ${item.item.charAt(0).toUpperCase() + item.item.slice(1)} - ${item.quantity}${item.unit}
                      <small class="d-block text-muted">${item.reason}</small>
                    </li>
                  `).join('')}
                </ul>
              ` : '<p class="text-muted mb-0">All items sufficiently stocked!</p>'}
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-3">
        <div class="col-12">
          <div class="alert alert-light border">
            <small class="text-muted">
              <i class="fas fa-info-circle me-1"></i>
              <strong>Future Enhancement:</strong> Budget goals and personalized recommendations will be configurable in upcoming versions.
            </small>
          </div>
        </div>
      </div>
    `;
    
    const cartElement = document.getElementById('smart-cart');
    if (cartElement) {
      cartElement.innerHTML = cartHTML;
    }
  }

  function renderHealthInsights() {
    const nutrition = smartAnalytics.calculateNutrition(kanishkDemoData.current_week.items_purchased);
    const proteinPercent = Math.round((nutrition.totalProtein / nutrition.proteinGoal) * 100);
    
    const insightsHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">
                <i class="fas fa-heart me-2"></i>Health Insights
              </h6>
              <ul class="list-unstyled">
                <li class="mb-2">🎯 Protein goal: ${proteinPercent}% achieved</li>
                <li class="mb-2">⚖️ Good balance of dairy and grains</li>
                <li class="mb-0">📊 ${proteinPercent >= 90 ? 'Excellent' : 'Good'} progress on fitness goals</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h6 class="card-title">
                <i class="fas fa-utensils me-2"></i>Nutrition Tips
              </h6>
              <ul class="list-unstyled">
                <li class="mb-2">🥛 Milk: Good for calcium and protein</li>
                <li class="mb-2">🍗 Chicken: Lean protein for muscles</li>
                <li class="mb-0">🥚 Eggs: Complete protein source</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add this to the dashboard
    const existingInsights = document.getElementById('health-insights');
    if (!existingInsights) {
      const insightsSection = document.createElement('div');
      insightsSection.id = 'health-insights';
      insightsSection.className = 'row mt-4';
      insightsSection.innerHTML = insightsHTML;
      
      const dashboard = document.getElementById('dashboard-view');
      const chartsSection = dashboard.querySelector('.row:last-child');
      dashboard.insertBefore(insightsSection, chartsSection);
    }
  }

  function getItemIcon(itemName) {
    const icons = {
      eggs: 'egg',
      milk: 'wine-bottle',
      chicken: 'drumstick-bite',
      bread: 'bread-slice',
      rice: 'rice',
      pasta: 'wheat-alt',
      cheese: 'cheese',
      bananas: 'apple-alt',
      yogurt: 'cup'
    };
    return icons[itemName] || 'shopping-basket';
  }

  // Enhanced initDashboard function
  window.initDashboard = function(){
    const user = AppState.getUser();
    console.log("Initializing dashboard for:", user?.email);
    
    if (user && user.email === 'Kanishkmehto6518@gmail.com') {
      // Load enhanced demo for Kanishk
      renderKPIs(kanishkDemoData);
      renderEnhancedDashboard();
      loadHeatmap(); // Still load heatmap
    } else {
      // Normal dashboard for other users
      loadSummary();
      loadHeatmap();
    }
  }

  // Make analytics available globally for debugging
  window.smartAnalytics = smartAnalytics;
  window.kanishkDemoData = kanishkDemoData;

})();