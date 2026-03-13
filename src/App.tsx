import React, { useState, useEffect } from 'react';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, getDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from './firebase';
import { Product, UserProfile } from './types';
import { handleFirestoreError, OperationType } from './utils/errorHandling';
import { ProductCard } from './components/ProductCard';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShoppingBag, LogIn, LogOut, Plus, Search, Menu, X, MapPin } from 'lucide-react';

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const categories = ['All', 'Skin Care', 'Hair Care', 'Body Care', 'Bags', 'Cosmetics', 'Watches'];

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Check/Create user profile
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Create profile
            const newProfile = {
              email: currentUser.email || '',
              role: currentUser.email === 'hossainmdshanzid@gmail.com' ? 'admin' : 'customer',
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newProfile);
            setUserProfile({ id: currentUser.uid, ...newProfile } as UserProfile);
          } else {
            setUserProfile({ id: currentUser.uid, ...userSnap.data() } as UserProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Products Listener
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'products');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const isAdmin = userProfile?.role === 'admin' || user?.email === 'hossainmdshanzid@gmail.com';

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-3">
              {/* Replace the src with your uploaded logo URL */}
              <img src="https://scontent.fdac189-1.fna.fbcdn.net/v/t39.30808-6/649324237_122214582788347251_8489792486448816812_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=13d280&_nc_ohc=YwzfwVevyPUQ7kNvwF9Ro36&_nc_oc=Adks0mUo3C7fHVCTMl9-riufayNtxn67ptcsXsXN2ubvg-0iqugJuza9QWMHaH0s3pw&_nc_zt=23&_nc_ht=scontent.fdac189-1.fna&_nc_gid=GqQO0zmADfS6ncpH1LM7Hw&_nc_ss=8&oh=00_Afzy1fj8a9lizDmeYBm0YUDRp-9sANXOVTAtHH_A-q5r_A&oe=69BA1B47" alt="Marvelle Logo" className="h-10 object-contain" />
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {categories.slice(1).map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`text-sm font-medium transition-colors ${
                    activeCategory === category ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 px-4 py-2 rounded-full hover:bg-rose-100 transition-colors"
                >
                  <Plus size={16} />
                  Add Product
                </button>
              )}
              
              <div className="flex items-center">
                {isSearchOpen ? (
                  <div className="flex items-center bg-slate-100 rounded-full px-3 py-1.5 animate-in fade-in slide-in-from-right-4 duration-200">
                    <Search size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      className="bg-transparent border-none outline-none text-sm ml-2 w-40 lg:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                    <button 
                      onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} 
                      className="text-slate-400 hover:text-slate-600 ml-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsSearchOpen(true)} 
                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Search size={20} />
                  </button>
                )}
              </div>
              
              <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors relative">
                <ShoppingBag size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
              </button>

              {user ? (
                <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                  <img 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                  >
                    <LogOut size={16} />
                    <span className="hidden lg:inline">Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-sm"
                >
                  <LogIn size={16} />
                  Sign In
                </button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 py-4 px-4 space-y-4 shadow-lg absolute w-full">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center bg-slate-100 rounded-xl px-4 py-2 mb-2">
                <Search size={18} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="bg-transparent border-none outline-none text-sm ml-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveCategory(category);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left px-4 py-2 rounded-lg text-sm font-medium ${
                    activeCategory === category ? 'bg-rose-50 text-rose-600' : 'text-slate-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowAdminPanel(true);
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 w-full text-sm font-medium text-rose-600 bg-rose-50 px-4 py-3 rounded-xl"
                >
                  <Plus size={18} />
                  Add New Product
                </button>
              )}
              
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full text-sm font-medium text-slate-600 bg-slate-100 px-4 py-3 rounded-xl"
                >
                  <LogOut size={18} />
                  Sign Out ({user.email?.split('@')[0]})
                </button>
              ) : (
                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center gap-2 w-full bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-medium"
                >
                  <LogIn size={18} />
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Marketing Banner Section */}
      <div className="w-full bg-slate-100 relative">
        <img 
          src="https://scontent.fdac189-1.fna.fbcdn.net/v/t39.30808-6/650258821_122214582686347251_7152517670965953034_n.jpg?stp=dst-jpg_s2048x2048_tt6&_nc_cat=100&ccb=1-7&_nc_sid=13d280&_nc_ohc=6EL9sMOGth4Q7kNvwE9olYP&_nc_oc=AdlTclpkpdDYbFUFjH5IpQSGllDDCaj1Ka_U0XLwT2INiV0D5ZHhsSg6s7s9wsTKTgk&_nc_zt=23&_nc_ht=scontent.fdac189-1.fna&_nc_gid=rkfrYMqmPI4nT6wKu-jdHw&_nc_ss=8&oh=00_Afy3mKQgjVrweVabZNV1B69pzvHZ8weIFDASvWuSwDKffg&oe=69B9E874" 
          alt="Special Offer Banner" 
          className="w-full h-64 md:h-96 object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 md:pb-12 w-full">
            <span className="inline-block py-1 px-3 rounded-full bg-rose-500 text-white text-xs font-bold tracking-wide uppercase mb-3">
              Special Offer
            </span>
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white leading-tight">
              Discover Your True Beauty
            </h1>
          </div>
        </div>
      </div>

      {/* Announcement Text */}
      <div className="bg-rose-50 border-b border-rose-100 py-8 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-slate-800 text-lg md:text-xl font-medium leading-relaxed">
            You can now explore all of our products along with their prices. Customers are welcome to visit our showroom to purchase products directly. Our online shopping service will be launching very soon.
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h2 className="text-3xl font-serif font-bold text-slate-900">
            {activeCategory === 'All' ? 'Featured Products' : `${activeCategory} Collection`}
          </h2>
          
          <div className="flex overflow-x-auto pb-2 md:pb-0 hide-scrollbar gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 aspect-square rounded-2xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3 mb-3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 mb-3"></div>
                <div className="h-5 bg-slate-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                isAdmin={isAdmin}
                onEditProduct={setEditingProduct}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 border-dashed">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="text-slate-400" size={24} />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No products found</h3>
            <p className="text-slate-500">
              {activeCategory === 'All' 
                ? "We haven't added any products yet." 
                : `No products available in the ${activeCategory} category.`}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowAdminPanel(true)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white bg-rose-600 px-6 py-3 rounded-full hover:bg-rose-700 transition-colors"
              >
                <Plus size={16} />
                Add First Product
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              {/* Replace the src with your uploaded logo URL */}
              <img src="https://placehold.co/100x40/0f172a/e11d48?text=Marvelle" alt="Marvelle Logo" className="h-8 object-contain" />
            </div>
            <p className="text-slate-400 max-w-md leading-relaxed mb-6">
              Your ultimate destination for premium beauty products, elegant bags, cosmetics, and luxury watches. We bring out the marvel in you.
            </p>
            <div className="flex items-start gap-3 text-slate-400">
              <MapPin className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">
                <strong className="text-slate-300 font-medium block mb-1">Showroom</strong>
                Shop No#C09, Level#02, Centrepoint,<br />
                Airport, Dhaka
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-rose-400 transition-colors">Skin Care</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Hair Care</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Body Care</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Bags</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Cosmetics</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Watches</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-6 uppercase tracking-wider text-sm">Support</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-rose-400 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">FAQs</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Shipping & Returns</a></li>
              <li><a href="#" className="hover:text-rose-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2026 Marvelle. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Twitter</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      {editingProduct && <AdminPanel productToEdit={editingProduct} onClose={() => setEditingProduct(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
