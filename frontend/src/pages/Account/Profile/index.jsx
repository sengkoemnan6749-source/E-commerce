import React, { useState } from 'react';
import { User, Mail, Phone, Building, Save } from 'lucide-react';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import { useAuth, useToast, useLanguage } from '../../../store/StoreContext';

export default function AccountProfile() {
  const { user, updateProfile } = useAuth();
  const { addToast } = useToast();
  const { language } = useLanguage();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    workspace: 'Software Development & Pro Media Studio'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    updateProfile(formData);
    setTimeout(() => {
      setSaving(false);
      addToast(
        language === 'km'
          ? 'បានធ្វើបច្ចុប្បន្នភាពព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ'
          : 'Profile details updated successfully',
        'success'
      );
    }, 400);
  };

  return (
    <div>
      <div className="pb-4 border-b border-slate-100 mb-6">
        <h2 className="text-lg font-bold text-slate-900">
          {language === 'km' ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'km'
            ? 'គ្រប់គ្រងព័ត៌មានទំនាក់ទំនង និងប្រវត្តិរូបរបស់អ្នកសម្រាប់វិក្កយបត្រ។'
            : 'Manage your contact credentials and professional profile for invoices.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <Input
          label={language === 'km' ? 'ឈ្មោះពេញផ្លូវការ *' : 'Full Legal Name *'}
          icon={User}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label={language === 'km' ? 'អាសយដ្ឋានអ៊ីមែល *' : 'Email Address *'}
          type="email"
          icon={Mail}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label={language === 'km' ? 'លេខទូរស័ព្ទចល័ត *' : 'Mobile Phone Number *'}
          icon={Phone}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />

        <Input
          label={language === 'km' ? 'កន្លែងធ្វើការ / ស្ថាប័ន' : 'Workspace / Organization'}
          icon={Building}
          value={formData.workspace}
          onChange={(e) => setFormData({ ...formData, workspace: e.target.value })}
          helperText={
            language === 'km'
              ? 'នឹងត្រូវបង្ហាញនៅលើវិញ្ញាបនបត្រធានាផ្លូវការរបស់អ្នក'
              : 'Will be displayed on your official serialized warranty certificate'
          }
        />

        <div className="pt-4">
          <Button type="submit" variant="primary" size="md" loading={saving}>
            <Save className="w-4 h-4 mr-2" />
            <span>{language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
