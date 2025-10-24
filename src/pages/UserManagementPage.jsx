import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, Edit, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/customSupabaseClient';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      // Note: Listing users requires admin privileges and should be done in a secure environment (e.g., a serverless function).
      // This is a simplified example and might not work without proper setup in Supabase.
      // You need to enable the "Use the Admin API" setting for your Supabase client.
      // This is generally not recommended for client-side code.
      // A better approach is to create a secure API endpoint (e.g., Supabase Edge Function) to expose user data.
      
      // For now, we will assume this is for a protected admin dashboard.
      // The error "Error fetching users" might appear if not configured correctly.
      const { data, error } = await supabase.from('users').select('id, raw_user_meta_data, email, role');

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les utilisateurs. Vérifiez les permissions RLS ou la console pour plus de détails.",
          variant: "destructive",
        });
      } else {
        // Attempt to fetch all users from auth schema if RLS allows
        const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error("Error fetching auth users:", authError);
            toast({
              title: "Erreur (Admin)",
              description: "Impossible de lister les utilisateurs. Assurez-vous que l'appel est fait avec les droits admin.",
              variant: "destructive",
            });
            setUsers([]);
        } else {
            setUsers(authUsers);
        }
      }
      setLoading(false);
    };

    fetchUsers();
  }, [toast]);

  const handleDeleteUser = async (userId) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      toast({
        title: "Erreur de suppression",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsers(users.filter(user => user.id !== userId));
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    }
  };

  const handleAddUser = () => {
    toast({
      title: "Ajouter un utilisateur",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  const handleEditUser = () => {
    toast({
      title: "Modifier un utilisateur",
      description: "🚧 Cette fonctionnalité n'est pas encore implémentée—mais ne vous inquiétez pas ! Vous pouvez la demander dans votre prochaine requête ! 🚀"
    });
  };

  return (
    <>
      <Helmet>
        <title>Gestion des Utilisateurs - Plateforme Bilan de Compétences</title>
        <meta name="description" content="Gérez les utilisateurs de la plateforme." />
      </Helmet>
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Gestion des Utilisateurs</h2>
            <p className="text-purple-200">Administrez les comptes des utilisateurs.</p>
          </div>
          <Button
            onClick={handleAddUser}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Ajouter un utilisateur
          </Button>
        </div>

        <motion.div 
          className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/20">
                  <th className="p-4 text-sm font-semibold text-white">Nom</th>
                  <th className="p-4 text-sm font-semibold text-white">Email</th>
                  <th className="p-4 text-sm font-semibold text-white">Rôle</th>
                  <th className="p-4 text-sm font-semibold text-white text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/10 last:border-b-0">
                      <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-56" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4 text-right"><Skeleton className="h-8 w-24 ml-auto rounded-md" /></td>
                    </tr>
                  ))
                ) : (
                  users.map((user, index) => (
                    <motion.tr 
                      key={user.id} 
                      className="border-b border-white/10 last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <td className="p-4 text-white/90">{user.user_metadata?.full_name || 'N/A'}</td>
                      <td className="p-4 text-white/90">{user.email}</td>
                      <td className="p-4 text-white/90 capitalize">{user.role || 'User'}</td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={handleEditUser} className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </section>
    </>
  );
};

export default UserManagementPage;