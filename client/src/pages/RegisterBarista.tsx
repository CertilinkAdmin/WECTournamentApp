import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Trophy, User, Coffee, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function RegisterBarista() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState({
    nationalChampion: false,
    wbcCompetitor: false,
    top6National: false
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: 'Missing info', description: 'Name and email are required', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          role: 'BARISTA',
          company,
          position,
          bio,
          eligibility
        })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }
      toast({ 
        title: 'Registration Successful!', 
        description: 'Your barista profile has been created. You can now be added to tournaments.' 
      });
      
      // Reset form
      setName('');
      setEmail('');
      setCompany('');
      setPosition('');
      setBio('');
      setEligibility({
        nationalChampion: false,
        wbcCompetitor: false,
        top6National: false
      });
    } catch (err: any) {
      toast({ title: 'Registration Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-amber-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-amber-400" />
          </div>
          <h1 className="text-4xl font-bold text-amber-100 mb-2">WEC 2025 Competitor Registration</h1>
          <p className="text-amber-200 text-lg">The next World Espresso Championship will be held on October 22nd at Bobino Milano.</p>
          
          {/* Registration Priority Info */}
          <div className="bg-blue-600 text-white p-4 rounded-lg mt-6 max-w-4xl mx-auto">
            <div className="font-semibold mb-2">Registration Priority:</div>
            <div>Current National Espresso Champions → WBC 2025 Competitors → Top 6 National Champions (2021 onwards)</div>
            <div className="text-sm mt-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Registration closes October 20th. Final competitor list announced October 21st.
            </div>
          </div>
        </div>

        {/* Saved Draft Section */}
        <div className="bg-amber-800 text-amber-100 p-3 rounded-lg mb-6 flex justify-between items-center">
          <span>You have a saved draft.</span>
          <div className="space-x-4">
            <button className="text-amber-300 hover:text-amber-100 underline">Resume draft</button>
            <button className="text-amber-300 hover:text-amber-100 underline">Clear draft</button>
          </div>
        </div>

        <form onSubmit={submit} className="max-w-4xl mx-auto space-y-6">
          {/* Eligibility Criteria Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Eligibility Criteria *
              </CardTitle>
              <p className="text-gray-300">Please select all categories that apply to you for registration priority (you can select multiple)</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current National Espresso Champion */}
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="national-champion"
                    checked={eligibility.nationalChampion}
                    onCheckedChange={(checked) => setEligibility(prev => ({ ...prev, nationalChampion: !!checked }))}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="national-champion" className="font-semibold">Current National Espresso Champion</Label>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">1st Priority</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">I am the current national espresso champion of my country.</p>
                  </div>
                </div>
              </div>

              {/* WBC 2025 Competitor */}
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="wbc-competitor"
                    checked={eligibility.wbcCompetitor}
                    onCheckedChange={(checked) => setEligibility(prev => ({ ...prev, wbcCompetitor: !!checked }))}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="wbc-competitor" className="font-semibold">Current National Barista Champion (WBC 2025)</Label>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">2nd Priority</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">I am the current national barista champion competing at WBC 2025.</p>
                  </div>
                </div>
              </div>

              {/* Top 6 National Champion */}
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="top6-national"
                    checked={eligibility.top6National}
                    onCheckedChange={(checked) => setEligibility(prev => ({ ...prev, top6National: !!checked }))}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="top6-national" className="font-semibold">Top 6 National Barista Champion (2021 onwards)</Label>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">3rd Priority (First Come First Served)</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">I was in the top 6 of my national barista championship from 2021 onwards.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Work Profile Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Work Profile *
              </CardTitle>
              <p className="text-gray-300">Tell us about your professional background and experience</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="position" className="text-white">Current Position *</Label>
                  <Input 
                    id="position" 
                    value={position} 
                    onChange={e => setPosition(e.target.value)} 
                    placeholder="e.g., Head Barista, Coffee Director"
                    className="bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-white">Company/Organization *</Label>
                  <Input 
                    id="company" 
                    value={company} 
                    onChange={e => setCompany(e.target.value)} 
                    placeholder="e.g., Blue Bottle Coffee, Local Roastery"
                    className="bg-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bio" className="text-white">Professional Experience *</Label>
                <textarea 
                  id="bio" 
                  className="w-full border rounded-md p-3 h-32 bg-white" 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Describe your coffee career, key roles, and professional journey..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={submitting}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-2"
            >
              {submitting ? 'Submitting...' : 'Submit Registration'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


