import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Edit, Phone, Mail, User, Shield, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function EmergencyContacts() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({ name: '', relationship: '', email: '', phone: '' });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: () => base44.entities.EmergencyContact.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.EmergencyContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      toast.success('Contact added successfully!');
      closeModal();
    },
    onError: (err) => toast.error(`Failed to add contact: ${err.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmergencyContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      toast.success('Contact updated successfully!');
      closeModal();
    },
    onError: (err) => toast.error(`Failed to update contact: ${err.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EmergencyContact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyContacts'] });
      toast.success('Contact removed.');
    },
    onError: (err) => toast.error(`Failed to remove contact: ${err.message}`),
  });

  const openModal = (contact = null) => {
    setEditingContact(contact);
    setFormData(contact ? { ...contact } : { name: '', relationship: '', email: '', phone: '' });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this contact?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link to={createPageUrl("Emergency")} className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Emergency Page
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
              <Phone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Manage Emergency Contacts</h1>
              <p className="text-slate-500">Add up to 5 trusted contacts for emergency alerts.</p>
            </div>
          </div>
          {contacts.length < 5 && (
            <Button onClick={() => openModal()}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          )}
        </div>

        {isLoading ? (
          <p>Loading contacts...</p>
        ) : contacts.length === 0 ? (
          <Card className="text-center p-8 border-dashed">
            <CardContent>
              <Shield className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800">No Contacts Yet</h3>
              <p className="text-slate-500 mt-2 mb-4">Add your first emergency contact to enable the alert system.</p>
              <Button onClick={() => openModal()}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((contact, i) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-white shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-red-500"/>
                        <span>{contact.name}</span>
                      </div>
                      <Badge variant="secondary">{contact.relationship}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                     <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="w-4 h-4"/>
                        <span>{contact.email}</span>
                     </div>
                     <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-4 h-4"/>
                        <span>{contact.phone || 'No phone number'}</span>
                     </div>
                     <div className="flex justify-end gap-2 pt-2 border-t mt-3">
                        <Button variant="ghost" size="icon" onClick={() => openModal(contact)}><Edit className="w-4 h-4"/></Button>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(contact.id)}><Trash2 className="w-4 h-4"/></Button>
                     </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="bg-white">
                <DialogHeader>
                    <DialogTitle>{editingContact ? 'Edit' : 'Add'} Emergency Contact</DialogTitle>
                    <DialogDescription>
                        This contact will be notified immediately when you trigger an emergency alert.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required/>
                    </div>
                    <div>
                        <Label htmlFor="relationship">Relationship</Label>
                        <Input id="relationship" value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} required/>
                    </div>
                    <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required/>
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <Input id="phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" disabled={createMutation.isLoading || updateMutation.isLoading}>
                            {editingContact ? 'Save Changes' : 'Add Contact'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}